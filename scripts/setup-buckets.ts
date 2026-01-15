import { createSupabaseAdminClient } from "./src/lib/supabase/admin";
import { FORMATIVE_BUCKETS } from "./src/lib/studylab/storage";

async function setupBuckets() {
    const admin = createSupabaseAdminClient();

    for (const [key, name] of Object.entries(FORMATIVE_BUCKETS)) {
        console.log(`Checking bucket: ${name}...`);
        const { data: bucket, error: getError } = await admin.storage.getBucket(name);

        if (getError || !bucket) {
            console.log(`Bucket ${name} not found. Creating...`);
            const { error: createError } = await admin.storage.createBucket(name, {
                public: false,
                fileSizeLimit: 52428800, // 50MB
            });

            if (createError) {
                console.error(`Error creating bucket ${name}:`, createError);
            } else {
                console.log(`Successfully created bucket: ${name}`);
            }
        } else {
            console.log(`Bucket ${name} already exists.`);
        }
    }
}

setupBuckets().catch(console.error);
