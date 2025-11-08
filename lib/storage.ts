import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase storage credentials are not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
    },
  })
}

export async function uploadToStorage({
  bucket,
  path,
  data,
  contentType,
}: {
  bucket: string
  path: string
  data: Buffer | ArrayBuffer
  contentType?: string
}) {
  const client = getClient()
  const arrayBuffer = data instanceof Buffer ? data : Buffer.from(new Uint8Array(data))

  const { error } = await client.storage.from(bucket).upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    throw error
  }

  return { bucket, path }
}

export async function downloadFromStorage({
  bucket,
  path,
}: {
  bucket: string
  path: string
}) {
  const client = getClient()
  const { data, error } = await client.storage.from(bucket).download(path)

  if (error || !data) {
    throw error ?? new Error("File not found in storage")
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

