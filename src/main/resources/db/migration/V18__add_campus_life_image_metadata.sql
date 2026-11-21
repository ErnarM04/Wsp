alter table dorm_buildings
    add column if not exists image_storage_path varchar(500),
    add column if not exists image_original_name varchar(255),
    add column if not exists image_content_type varchar(100);

alter table dorm_rooms
    add column if not exists image_storage_path varchar(500),
    add column if not exists image_original_name varchar(255),
    add column if not exists image_content_type varchar(100);

alter table food_items
    add column if not exists image_storage_path varchar(500),
    add column if not exists image_original_name varchar(255),
    add column if not exists image_content_type varchar(100);
