import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as crypto from "crypto"
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as r53targets from 'aws-cdk-lib/aws-route53-targets'

export class TryCdk0001Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Load context parameters from cdk.json.
    const environment = this.node.tryGetContext("environment")
    const params = this.node.tryGetContext(environment)

    // Load FQDN of the site.
    const siteFqdn = `${params.subDomainPrefix}.${params.rootDomainName}`

    // Make a web server resource (S3)
    const websiteBucket = new s3.Bucket(
      this,
      "WebBucket",
      {
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
        websiteErrorDocument: '404.html',
        websiteIndexDocument: 'index.html',
        websiteRoutingRules: [
          {
            condition: {
              httpErrorCodeReturnedEquals: "403",
            },
            httpRedirectCode: "302",
            hostName: siteFqdn,
            protocol: s3.RedirectProtocol.HTTPS,
          }
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    )

    // Generate a token to identify access source (referrer).
    const sha1sum = crypto.createHash("sha1")
    sha1sum.update(params.account)
    sha1sum.update(params.region)
    sha1sum.update(siteFqdn)
    const refererToken = sha1sum.digest("base64")

    // Configuration to allow access originating from the website bucket.
    const websiteBucketPolicyStatement = new iam.PolicyStatement(
      {
        sid: `Allow access originating from ${websiteBucket.bucketName} (${environment})`,
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:GetObject"],
        effect: iam.Effect.ALLOW,
        resources: [`${websiteBucket.bucketArn}/*`],
        conditions: {
          StringLike: {
            "aws:Referer": refererToken,
          }
        }
      }
    )
    websiteBucket.addToResourcePolicy(websiteBucketPolicyStatement)


    // Certificate
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      "Certificate",
      params.certificateArn
    )

    // Make a CDN resource (CloudFront).
    const distribution = new cloudfront.Distribution(
      this, "Distribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(websiteBucket, {
            customHeaders: {
              Referer: refererToken,
            }
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        certificate,
        domainNames: [siteFqdn],
        comment: `Try CDK Website ${params.environment}`,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      }
    )

    // Deploy the website contents to the web server.
    new s3deploy.BucketDeployment(
      this, "DeployWebsite",
      {
        sources: [s3deploy.Source.asset(params.webContentSource)],
        distribution: distribution,
        destinationBucket: websiteBucket,
      }
    )

    // DNS configuration.
    const zone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: params.rootDomainName,
    })

    //const aliasRecord = 
    new route53.ARecord(this, "AliasRecord", {
      zone,
      recordName: params.subDomainPrefix,
      target: route53.RecordTarget.fromAlias(
        new r53targets.CloudFrontTarget(distribution)
      ),
    })

    // Display values assigned after deployment.
    //   Distributions's domain name.
    new cdk.CfnOutput(
      this, "OutputDistributionDomainName",
      {
        value: distribution.distributionDomainName,
      }
    )

    //   Web bucket's URL. (for debug purpose)
    new cdk.CfnOutput(
      this, "OutputWebBucketUrl",
      {
        value: websiteBucket.bucketWebsiteDomainName,
      }
    )
  }
}
