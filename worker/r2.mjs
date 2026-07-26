// Upload MP4 len Cloudflare R2 (S3-compatible). Tra ve URL cong khai.
// Neu chua cau hinh R2 -> tra ve null (pipeline se tra duong dan file local de test).
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function uploadR2(filePath, key) {
  const account = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBase = process.env.R2_PUBLIC_BASE; // vd https://cdn.tikvn.io hoac https://pub-xxx.r2.dev
  if (!account || !bucket || !accessKey || !secretKey) return null;

  // Import dong de khong bat buoc co @aws-sdk khi chay mock.
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${account}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
  const body = await readFile(filePath);
  const objectKey = key || `videos/${path.basename(filePath)}`;
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: "video/mp4" })
  );
  return publicBase ? `${publicBase.replace(/\/$/, "")}/${objectKey}` : objectKey;
}
