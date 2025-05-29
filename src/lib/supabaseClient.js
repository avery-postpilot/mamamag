import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'x-application-name': 'mamamag-campaign-portal'
    }
  },
  // Add headers for Edge Functions
  headers: {
    'x-application-name': 'mamamag-campaign-portal'
  }
})

// Helper function to check if storage is available
export const checkStorage = async () => {
  try {
    // List all buckets first to check access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw listError
    }

    // Check if our bucket exists
    const productImagesBucket = buckets.find(b => b.name === 'product-images')
    
    if (!productImagesBucket) {
      // Create the bucket if it doesn't exist
      const { data: newBucket, error: createError } = await supabase.storage
        .createBucket('product-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
        })
      
      if (createError) {
        console.error('Error creating bucket:', createError)
        throw createError
      }
      
      console.log('Created product-images bucket:', newBucket)
    } else {
      console.log('Found existing product-images bucket:', productImagesBucket)
    }

    // Verify we can access the bucket
    const { data: bucket, error: getBucketError } = await supabase.storage
      .from('product-images')
      .list()

    if (getBucketError) {
      console.error('Error accessing bucket:', getBucketError)
      throw getBucketError
    }

    return { 
      available: true, 
      bucket: productImagesBucket || bucket 
    }
  } catch (error) {
    console.error('Storage check failed:', error.message)
    return { 
      available: false, 
      error: error.message 
    }
  }
}

// Helper function to get public URL for an image
export const getPublicUrl = (path) => {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)
  return data.publicUrl
}

// Helper function to upload an image
export const uploadImage = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Upload error:', error)
    return { data: null, error }
  }
}

// Designs table definition
export const designsTable = {
  name: 'designs',
  columns: {
    id: 'uuid primary key',
    brand_id: 'uuid references brands(id)',
    name: 'text',
    description: 'text',
    layout_type: 'text',
    design_url: 'text',
    preview_url: 'text',
    created_at: 'timestamp with time zone',
    updated_at: 'timestamp with time zone',
    is_active: 'boolean default true'
  }
} 