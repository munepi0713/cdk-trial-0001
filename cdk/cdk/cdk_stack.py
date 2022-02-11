from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_s3_deployment as s3deploy,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    CfnOutput,
    RemovalPolicy,
)
from constructs import Construct


class CdkStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Make a web server.
        bucket = s3.Bucket(
            self,
            "WebBucket",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            public_read_access=True,
            website_error_document="404.html",
            website_index_document="index.html",
        )

        # Expose the web server through CloudFront.
        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(bucket)
            ),
        )

        # Deploy site contents to the bucket.
        s3deploy.BucketDeployment(
            self,
            "DeployWebsite",
            sources=[s3deploy.Source.asset("../gatsby-blog/public/")],
            destination_bucket=bucket,
            distribution=distribution,
        )

        # Output distribution's domain name.
        CfnOutput(
            self,
            "DistributionDomainName",
            value=distribution.distribution_domain_name,
            export_name="DistributionDomainName",
        )

        # Output web_bucket's URL.
        CfnOutput(
            self,
            "WebBucketUrl",
            value=bucket.bucket_website_url,
        )
