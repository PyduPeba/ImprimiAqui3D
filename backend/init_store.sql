DO $$
DECLARE
    new_store_id uuid;
BEGIN
    -- Check if store exists
    IF NOT EXISTS (SELECT 1 FROM stores WHERE name = 'Loja Principal') THEN
        INSERT INTO stores (id, name, "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'Loja Principal', true, NOW(), NOW())
        RETURNING id INTO new_store_id;
        
        RAISE NOTICE 'Store created with ID: %', new_store_id;
    ELSE
        SELECT id INTO new_store_id FROM stores WHERE name = 'Loja Principal';
        RAISE NOTICE 'Store already exists with ID: %', new_store_id;
    END IF;

    -- Update admin user
    UPDATE users 
    SET "storeId" = new_store_id 
    WHERE email = 'admin@admin.com';
    
    RAISE NOTICE 'Updated admin user with store ID';
END $$;
