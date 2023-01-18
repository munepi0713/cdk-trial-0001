# Try! CDK No.0001: "Gatsby ベースのウェブサイトを S3/CloudFront で公開する（基礎編）"

[AWS CDK](https://aws.amazon.com/jp/cdk/) を使ったクラウドインフラ構築について、
実際に使っている構成を紹介するシリーズです。

## 概要

Gatsby ベースのウェブサイトを S3/CloudFront で公開します。

コンテンツ作成のフレームワークとして [Gatsby](https://www.gatsbyjs.com/docs/) を使用し、
静的サイト生成 (Static Site Generation: SSG) で公開データを作成します。

作成したデータは、
ストレージサーバーである S3 に配置してウェブサーバー機能オプションを有効にします。
さらに、アクセス性能や機能を補完するために、
コンテンツキャッシュ (Content Delivery Network) である CloudFront を接続して、
インターネットに公開します。

AWS サーバーレスでは定石となる構成ですが、
実際に使用している構成は、
独自ドメインの設定、
ステージングやテストなど複数バージョンのサイト構築、
Git ブランチとの連動、
CI (Continuous Integration) を用いたユニットテスト、
CD (Continuous Deployment) を用いた自動デプロイ（リリース）、
などを加えています。実用版は、別に紹介します。

## ファイル構成

```text
/
+-- cdk/       CDK を用いて書かれたインフラ構築のソースコード
+-- www/       Gatsby を用いて書かれたウェブサイトコンテンツを配置するディレクトリ
+-- README.md  本ファイル
```

Gatsby 部分は、ブログ用テンプレートを用いてゼロから構築して使います。  
それ以上については、本レポジトリの紹介範囲を超えますので、[公式サイト](https://www.gatsbyjs.com/)等の他のリソースを参照ください。

## 使い方１： クローンして使う

本レポジトリをクローンして使う方法について説明します。

まず、以下を済ませておいてください。
* [AWS のアカウント作成](https://aws.amazon.com/jp/register-flow/)
* [AWS CLI v2 のインストール](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html)
* [AWS CLI の認証の設定](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-quickstart.html)
* Node.js および npm のインストール

本レポジトリをクローンします。

```
git clone https://github.com/munepi0713/try-cdk-0001.git
```

Gatsby のソースコードをビルドします。

```
cd www
npm run build
cd ..
```

CDK のコードを実行し、インフラの作成と、コンテンツのデプロイを行います。  
完了まで５分程度かかります。

```
cd cdk 
cdk deploy
```

デプロイが完了すると、ターミナルに下記のような表示が出力されます。
この `d1c3no7aapiowc.cloudfront.net` を、ウェブブラウザで開くとサイトが表示されます。

```
Outputs:
TryCdk0001Stack.OutputDistributionDomainName = d1c3no7aapiowc.cloudfront.net
```

## 使い方２： コピペして使う

本レポジトリの内容を参照はするが、
ゼロから独自にコードを書いていく場合の手順を説明します。

Gatsby が提供している Starter と呼ばれるキットの一つである、
[`gatsby-starter-blog`](https://github.com/gatsbyjs/gatsby-starter-blog) を使って、
ウェブサイトコンテンツを作成します。

なお、本レポジトリの CDK コードは `www` というディレクトリに作成されている前提で書かれています。
この項目を変更する場合は、CDK 側のソースコードも変更する必要がありますのでご注意ください。

```
npx gatsby new www https://github.com/gatsbyjs/gatsby-starter-blog
```

Gatsby のコードをビルドします。

```
cd www
npm run build
cd ..
```

次に、 CDK コードを作成します。

CDK 用のディレクトリを作成し、CDK の初期化コマンドを実行します。

```
mkdir cdk
cd cdk
cdk init app --language typescript
```

以下のファイルを編集していきます。

* `cdk/bin/cdk.ts`
* `cdk/lib/cdk-stack.ts`
* `cdk/cdk.json`

### `cdk/bin/cdk.ts`
### `cdk/lib/cdk-stack.ts`
### `cdk/cdk.json`

### Edit CDK code.

Open Visual Studio Code. You should enjoy coding with IntelliSense.

Edit `try-cdk-0009/cdk/cdk/app.py` and update the stack id (`TryCdk0009` in this repo.).

```
CdkStack(app, "TryCdk0009",
```

Edit `try-cdk-0009/cdk/cdk/cdk_stack.py` to configure AWS infra.

### Setup Next.js code.

Locate at the top of `try-cdk-0009` directory.

c.f. https://nextjs.org/learn/basics/create-nextjs-app/setup

```
npx create-next-app nextjs-blog --use-npm --example "https://github.com/vercel/next-learn/tree/master/basics/learn-starter"
```

## Deploy

Needs passing your parameters as Contexts.

```
cdk deploy -c ROOT_DOMAIN_NAME=munepi.com -c HOSTED_ZONE_ID=Z99999999ZZZZZZZZZZZZ -c CERTIFICATE_ARN=arn:aws:acm:us-east-1:999999999999:certificate/ac9564db-15d8-4f37-af06-eaa862488829
```
