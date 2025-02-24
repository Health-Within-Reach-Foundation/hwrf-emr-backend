-- Insert permissions into the "permissions" table

INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'administration:write', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'administration:read', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'administration:no access', NOW(), NOW());

-- INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'clinics:read', NOW(), NOW());
-- INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'clinics:write', NOW(), NOW());
-- INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'clinics:no access', NOW(), NOW());

INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'queues:read', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'queues:write', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'queues:no access', NOW(), NOW());

INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'camps:read', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'camps:write', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'camps:no access', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'camps:finance', NOW(), NOW());

INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'patients:read', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'patients:write', NOW(), NOW());
INSERT INTO public."permissions" ("id", "action", "created_at", "updated_at") VALUES (uuid_generate_v4(), 'patients:no access', NOW(), NOW());

