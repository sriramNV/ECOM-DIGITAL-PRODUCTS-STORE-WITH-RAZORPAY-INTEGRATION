import { S3Client, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT;
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;
const bucket = process.env.MINIO_BUCKET;

if (!endpoint || !accessKey || !secretKey || !bucket) {
  console.log("Storage env vars not set, skipping bucket init");
  process.exit(0);
}

const client = new S3Client({
  endpoint,
  region: "us-east-1",
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }));
  console.log(`Bucket "${bucket}" exists`);
} catch (e) {
  if (e.name === "NotFound" || e.name === "NoSuchBucket") {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Bucket "${bucket}" created`);
  } else {
    console.error(`Bucket check failed: ${e.message}`);
    process.exit(1);
  }
}
