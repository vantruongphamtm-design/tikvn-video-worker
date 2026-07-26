// Upload MP4 len Cloudflare R2 (S3-compatible). Tra ve URL tai video.
// - Neu co R2_PUBLIC_BASE (bucket bat public) -> tra URL cong khai.
// - Neu bucket private (mac dinh TikVN) -> tra presigned GET URL (ky san, 7 ngay).
// - Chua cau hinh R2 -> tra null (pipeline tra duong dan file local de test).
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function uploadR2(filePath, key) {
  // Chap nhan ca ten bien cua app TikVN (R2_ENDPOINT_URL / R2_BUCKET_NAME) lan ten cu.
  const endpoint =
    process.env.R2_ENDPOINT_URL ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : null);
  const bucket = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBase = process.env.R2_PUBLIC_BASE; // vd https://cdn.tikvn.io hoac https://pub-xxx.r2.dev
  if (!endpoint || !bucket || !accessKey || !secretKey) return null;

  // Import dong de khong bat buoc co @aws-sdk khi chay mock.
  const { S3Client, PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
  const body = await readFile(filePath);
  const objectKey = key || `videos/${path.basename(filePath)}`;
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: "video/mp4" })
  );

  if (publicBase) return `${publicBase.replace(/\/$/, "")}/${objectKey}`;

  // Bucket private -> link tai truc tiep co chu ky (khong can CORS/public). Toi da 7 ngay.
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: objectKey }), {
    expiresIn: 604800,
  });
}
