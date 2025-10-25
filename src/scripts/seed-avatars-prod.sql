-- =================================================================
-- PRODUCTION AVATAR SEED SCRIPT
-- =================================================================
-- INSTRUCTIONS:
-- 1. Go to your Supabase project's SQL Editor.
-- 2. Copy and paste the entire content of this script.
-- 3. Click "RUN".
--
-- This will safely add all the avatar data to your production tables.
-- =================================================================

-- Clear existing data to prevent duplicates if re-running
DELETE FROM public.avatar_fated_relationships;
DELETE FROM public.avatar_stats;
DELETE FROM public.avatars;
-- Reset the ID sequence to start from 1
ALTER SEQUENCE public.avatars_id_seq RESTART WITH 1;


-- Function to insert an avatar and its related data
CREATE OR REPLACE FUNCTION insert_avatar_with_relations(
    avatar_name text,
    avatar_grade text,
    avatar_image text,
    avatar_stats jsonb,
    fated_name text,
    fated_desc text
)
RETURNS void AS $$
DECLARE
    new_avatar_id bigint;
    stat_record jsonb;
BEGIN
    -- Insert avatar and get its new ID
    INSERT INTO public.avatars (name, grade, image_url)
    VALUES (avatar_name, avatar_grade, avatar_image)
    RETURNING id INTO new_avatar_id;

    -- Insert stats
    FOR stat_record IN SELECT * FROM jsonb_array_elements(avatar_stats)
    LOOP
        INSERT INTO public.avatar_stats (avatar_id, attribute, value, icon)
        VALUES (
            new_avatar_id,
            stat_record->>'attribute',
            stat_record->>'value',
            stat_record->>'icon'
        );
    END LOOP;

    -- Insert fated relationship
    INSERT INTO public.avatar_fated_relationships (avatar_id, name, description)
    VALUES (new_avatar_id, fated_name, fated_desc);
END;
$$ LANGUAGE plpgsql;

-- Seed all the avatars using the function

SELECT insert_avatar_with_relations(
    'Unknown Awakening Elsie', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+144", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+135", "icon": "shield" },
      { "attribute": "Dmg to Monsters", "value": "+6%", "icon": "dna" },
      { "attribute": "Bow Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Simon', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Liberator Radiant', 'Mythic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+100%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+50%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+20%", "icon": "forward" },
      { "attribute": "Attack", "value": "+270", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+280", "icon": "shield" },
      { "attribute": "Dmg to Monsters", "value": "+10%", "icon": "dna" },
      { "attribute": "Dmg Received Decrease", "value": "8%", "icon": "minus-circle" },
      { "attribute": "Max HP", "value": "540", "icon": "heart-pulse" },
      { "attribute": "Status Effects Res.", "value": "9%", "icon": "shield-check" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Conqueror Marek', 'Mythic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+100%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+50%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+20%", "icon": "forward" },
      { "attribute": "Attack", "value": "+280", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+270", "icon": "shield" },
      { "attribute": "All Damage in PvP", "value": "10%", "icon": "swords" },
      { "attribute": "Dmg Received Decrease", "value": "8%", "icon": "minus-circle" },
      { "attribute": "Max HP", "value": "540", "icon": "heart-pulse" },
      { "attribute": "Status Effects Res.", "value": "9%", "icon": "shield-check" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Unyielding Ambition Garbana', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+80%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+230", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+220", "icon": "shield" },
      { "attribute": "All Damage in PvP", "value": "7%", "icon": "swords" },
      { "attribute": "Accuracy", "value": "90", "icon": "target" },
      { "attribute": "Max HP", "value": "450", "icon": "heart-pulse" }
    ]',
    'Krous', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Blessing of Alchemy Nesha', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+80%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+230", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+220", "icon": "shield" },
      { "attribute": "Dmg Received Decrease in PvP", "value": "7%", "icon": "minus-circle" },
      { "attribute": "Evasion", "value": "90", "icon": "shield-check" },
      { "attribute": "Max HP", "value": "450", "icon": "heart-pulse" }
    ]',
    'Aquila', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Immortal Veteran Deligeon', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+79%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+225", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+215", "icon": "shield" },
      { "attribute": "Dmg Received from Monsters", "value": "Decrease 8%", "icon": "minus-circle" },
      { "attribute": "MP Recovery in Battle", "value": "20", "icon": "gem" },
      { "attribute": "Max HP", "value": "420", "icon": "heart-pulse" }
    ]',
    'Rowain', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Iron-Blooded Strategist Krous', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+79%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+225", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+215", "icon": "shield" },
      { "attribute": "Dmg to Monsters", "value": "Increase 8%", "icon": "dna" },
      { "attribute": "HP Recovery in Battle", "value": "40", "icon": "heart-pulse" },
      { "attribute": "Max HP", "value": "420", "icon": "heart-pulse" }
    ]',
    'Karmen', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Lawless Empress Karmen', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+78%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+220", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+210", "icon": "shield" },
      { "attribute": "All Damage", "value": "6%", "icon": "swords" },
      { "attribute": "Critical Hit Resistance", "value": "80", "icon": "shield-check" },
      { "attribute": "Max HP", "value": "390", "icon": "heart-pulse" }
    ]',
    'Lael', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Ruler of the Desert Aquila', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+78%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+220", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+210", "icon": "shield" },
      { "attribute": "Damage Received Decrease", "value": "6%", "icon": "minus-circle" },
      { "attribute": "Critical Hit", "value": "80", "icon": "target" },
      { "attribute": "Max HP", "value": "390", "icon": "heart-pulse" }
    ]',
    'Eldrich', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Grand Warlock of Schemes Eldrich', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+77%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+215", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+205", "icon": "shield" },
      { "attribute": "Skill Damage", "value": "8%", "icon": "gem" },
      { "attribute": "Endurance Ignore", "value": "50", "icon": "target" },
      { "attribute": "Max HP", "value": "390", "icon": "heart-pulse" }
    ]',
    'Morian', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'White Wolf Barthes', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+77%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+215", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+205", "icon": "shield" },
      { "attribute": "Critical Hit Damage", "value": "8%", "icon": "gem" },
      { "attribute": "Endurance", "value": "50", "icon": "heart-pulse" },
      { "attribute": "Max HP", "value": "390", "icon": "heart-pulse" }
    ]',
    'Lael', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Shadow Witch Morian', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+76%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+210", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+200", "icon": "shield" },
      { "attribute": "Dmg to Boss Monsters", "value": "Increase 10%", "icon": "dna" },
      { "attribute": "Accuracy", "value": "80", "icon": "target" },
      { "attribute": "Max HP", "value": "360", "icon": "heart-pulse" }
    ]',
    'Barthes', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Blue Rose Rowain', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+76%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+205", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+195", "icon": "shield" },
      { "attribute": "Dmg to Elite Monsters", "value": "Increase 10%", "icon": "dna" },
      { "attribute": "Accuracy", "value": "80", "icon": "target" },
      { "attribute": "Max HP", "value": "360", "icon": "heart-pulse" }
    ]',
    'Deligeon', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Radiance of the Sun Lael', 'Legendary', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+75%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+35%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+15%", "icon": "forward" },
      { "attribute": "Attack", "value": "+200", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+190", "icon": "shield" },
      { "attribute": "Dmg to Normal Monsters", "value": "Increase 10%", "icon": "dna" },
      { "attribute": "Accuracy", "value": "80", "icon": "target" },
      { "attribute": "Max HP", "value": "360", "icon": "heart-pulse" }
    ]',
    'Rowain', 'Attack Speed +10%, Channeling Speed +5%, All Damage +3%'
);

SELECT insert_avatar_with_relations(
    'Sun''s Xergios', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+145", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+134", "icon": "shield" },
      { "attribute": "Dmg Rcvd from Monsters", "value": "-6%", "icon": "minus-circle" },
      { "attribute": "Staff Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Huxley', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Gray Heinkell', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+140", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+139", "icon": "shield" },
      { "attribute": "Dmg Rcvd from Monsters", "value": "Decrease 6%", "icon": "minus-circle" },
      { "attribute": "Dual Daggers Equip CD", "value": "Decrease +5%", "icon": "minus-circle" }
    ]',
    'Parrell', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Contemptuous Bernois', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+118", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+108", "icon": "shield" },
      { "attribute": "Critical Hit", "value": "75", "icon": "target" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Clumsy Ambition Adan', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+35%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+110", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+100", "icon": "shield" },
      { "attribute": "Accuracy", "value": "30", "icon": "target" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Touch of a Beast Kaisa', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+141", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+138", "icon": "shield" },
      { "attribute": "All Damage", "value": "4%", "icon": "swords" },
      { "attribute": "Bare Hands/Knuckles Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Godfried', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Lieutenant of Condemnation Paiton', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+147", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+132", "icon": "shield" },
      { "attribute": "Damage Received Decrease", "value": "4%", "icon": "minus-circle" },
      { "attribute": "Sword and Shield Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Pheon', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Frozen Gaby', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+140", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+139", "icon": "shield" },
      { "attribute": "All Damage", "value": "4%", "icon": "swords" },
      { "attribute": "Battle Staff Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Priscilla', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Helper of Light Priscilla', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+125", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+120", "icon": "shield" },
      { "attribute": "Skill Damage", "value": "7%", "icon": "gem" }
    ]',
    'Gaby', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Pioneer of Oaths Dorothea', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+130", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+115", "icon": "shield" },
      { "attribute": "Critical Hit Damage", "value": "7%", "icon": "gem" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Oathbound Godfried', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+125", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+120", "icon": "shield" },
      { "attribute": "All Damage in PvP", "value": "6%", "icon": "swords" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Bringer of Rest Pheon', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+130", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+115", "icon": "shield" },
      { "attribute": "Damage Received Decrease in PvP", "value": "6%", "icon": "minus-circle" }
    ]',
    'Paiton', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Blazing Faith Biwis', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+148", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+131", "icon": "shield" },
      { "attribute": "Damage Received Decrease", "value": "4%", "icon": "minus-circle" },
      { "attribute": "Battle Shield Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Celior', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Promised Glory Sith', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+142", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+137", "icon": "shield" },
      { "attribute": "All Damage", "value": "4%", "icon": "swords" },
      { "attribute": "Greatsword Equip CD", "value": "+5%", "icon": "minus-circle" }
    ]',
    'Seron', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Faint Smile Giselle', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+50%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+143", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+136", "icon": "shield" },
      { "attribute": "Dmg to Monsters", "value": "Increase 6%", "icon": "dna" },
      { "attribute": "Crossbow Equip CD", "value": "-5%", "icon": "minus-circle" }
    ]',
    'Linda', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Outlaw Predator Seron', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+131", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+122", "icon": "shield" },
      { "attribute": "HP Recovery in Battle", "value": "30", "icon": "heart-pulse" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Investigator Linda', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+131", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+119", "icon": "shield" },
      { "attribute": "Accuracy", "value": "80", "icon": "target" }
    ]',
    'Faint Smile Giselle', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Guide of Runes Simon', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+132", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+122", "icon": "shield" },
      { "attribute": "Critical Hit Resistance", "value": "70", "icon": "shield-check" }
    ]',
    'Unknown Awakening Elsie', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Pioneer of Knowledge Axana', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+45%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+133", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+123", "icon": "shield" },
      { "attribute": "Gold Gain", "value": "2.5%", "icon": "gem" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Affectionate Compassion Musetta', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+120", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+115", "icon": "shield" },
      { "attribute": "All Damage", "value": "4%", "icon": "swords" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Burning Desert Amira', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+125", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+110", "icon": "shield" },
      { "attribute": "Damage Received Decrease", "value": "4%", "icon": "minus-circle" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Iron Wall Master Thalia', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+122", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+111", "icon": "shield" },
      { "attribute": "MP Recovery in Battle", "value": "15", "icon": "gem" }
    ]',
    'N/A', ''
);

SELECT insert_avatar_with_relations(
    'Silent Parrell', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+119", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+111", "icon": "shield" },
      { "attribute": "Evasion", "value": "75", "icon": "shield-check" }
    ]',
    'Gray Heinkell', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Rising Light Celior', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+123", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+108", "icon": "shield" },
      { "attribute": "Max HP", "value": "300", "icon": "heart-pulse" }
    ]',
    'Biwis', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Dragon''s Fang Huxley', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+124", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+112", "icon": "shield" },
      { "attribute": "Bag Weight", "value": "300", "icon": "gem" }
    ]',
    'Sun''s Xergios', 'Attack Speed +4%, Channeling Speed +4%'
);

SELECT insert_avatar_with_relations(
    'Hawk''s Talon Ricardo', 'Epic', '/l9rs/avatar.png',
    '[
      { "attribute": "Attack Speed", "value": "+40%", "icon": "wind" },
      { "attribute": "Channeling Speed", "value": "+15%", "icon": "zap" },
      { "attribute": "Movement Speed", "value": "+5%", "icon": "forward" },
      { "attribute": "Attack", "value": "+124", "icon": "swords" },
      { "attribute": "Defense Power", "value": "+114", "icon": "shield" },
      { "attribute": "Gold Gain", "value": "2.5%", "icon": "gem" }
    ]',
    'N/A', ''
);

-- Clean up the function
DROP FUNCTION insert_avatar_with_relations;
