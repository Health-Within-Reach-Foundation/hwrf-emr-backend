-- Inserting for 'Dental Diagnosis Form'
INSERT INTO
    public."form_fields" (
        "id",
        "form_name",
        "form_field_data",
        "created_at",
        "updated_at"
    )
VALUES
    (
        uuid_generate_v4 (),
        'Dental Diagnosis Form',
        '[
            { 
                "fieldName": "complaints", 
                "type": "select", 
                "options": [
                    {"label": "Bad breath", "value": "Bad breath", "lock": true}, 
                    {"label": "Tooth ache", "value": "Tooth ache", "lock": true}, 
                    {"label": "Missing tooth", "value": "Missing tooth", "lock": true}, 
                    {"label": "Food lodgement", "value": "Food lodgement", "lock": true}, 
                    {"label": "Sensitivity to cold", "value": "Sensitivity to cold", "lock": true}, 
                    {"label": "Sensitivity to sweet", "value": "Sensitivity to sweet", "lock": true}, 
                    {"label": "Pain while chewing", "value": "Pain while chewing", "lock": true}, 
                    {"label": "Fracture teeth", "value": "Fracture teeth", "lock": true}, 
                    {"label": "Carios tooth", "value": "Carios tooth", "lock": true}, 
                    {"label": "Stains", "value": "Stains", "lock": true}, 
                    {"label": "Tartar deposits", "value": "Tartar deposits", "lock": true}, 
                    {"label": "Bleeding gums", "value": "Bleeding gums", "lock": true}, 
                    {"label": "Mobile Teeth", "value": "Mobile Teeth", "lock": true}, 
                    {"label": "Swelling", "value": "Swelling", "lock": true}, 
                    {"label": "Brushing Sensation", "value": "Brushing Sensation", "lock": true}, 
                    {"label": "Ulcers in mouth", "value": "Ulcers in mouth", "lock": true}, 
                    {"label": "Reduced mouth opening", "value": "Reduced mouth opening", "lock": true}, 
                    {"label": "Malaligned teeth", "value": "Malaligned teeth", "lock": true}
                ]
            },
            { 
                "fieldName": "treatmentSuggested", 
                "type": "select", 
                "options": [
                    { "label": "RCT - Simple", "value": "RCT - Simple", "lock": true },
                    { "label": "GIC", "value": "GIC", "lock": true },
                    { "label": "Composite", "value": "Composite", "lock": true },
                    { "label": "RCT - Complex", "value": "RCT - Complex", "lock": true },
                    { "label": "RCT - Third molar", "value": "RCT - Third molar", "lock": true },
                    { "label": "Direct pulp capping OR DPC (dycal+temp)", "value": "Direct pulp capping OR DPC (dycal+temp)", "lock": true },
                    { "label": "IPC done IPC (dycal+GIC)", "value": "IPC done IPC (dycal+GIC)", "lock": true },
                    { "label": "Extraction", "value": "Extraction", "lock": true },
                    { "label": "Crown", "value": "Crown", "lock": true },
                    { "label": "Bridge", "value": "Bridge", "lock": true },
                    { "label": "Scaling", "value": "Scaling", "lock": true },
                    { "label": "Polishing", "value": "Polishing", "lock": true },
                    { "label": "Fluorid", "value": "Fluorid", "lock": true },
                    { "label": "Pit & fissure sealant", "value": "Pit & fissure sealant", "lock": true },
                    { "label": "Pulpotomy", "value": "Pulpotomy", "lock": true },
                    { "label": "Bleaching", "value": "Bleaching", "lock": true }
                ]
            }
        ]',
        NOW (),
        NOW ()
    );

-- Inserting for 'Dental Treatment Form'
INSERT INTO
    public."form_fields" (
        "id",
        "form_name",
        "form_field_data",
        "created_at",
        "updated_at"
    )
VALUES
    (
        uuid_generate_v4 (),
        'Dental Treatment Form',
        '[
            { 
                "fieldName": "treatmentStatusOptions", 
                "type": "select", 
                "options": [
                    { "label": "OPD done", "value": "OPD done", "lock": true },
                    { "label": "RCO done anterior", "value": "RCO done anterior", "lock": true },
                    { "label": "BMP done anterior", "value": "BMP done anterior", "lock": true },
                    { "label": "Obturation done anterior", "value": "Obturation done anterior", "lock": true },
                    { "label": "Single Sitting RCT - Anterior", "value": "Single Sitting RCT - Anterior", "lock": true },
                    { "label": "Single Sitting RCT - Post", "value": "Single Sitting RCT - Post", "lock": true },
                    { "label": "RCO - Posterior", "value": "RCO - Posterior", "lock": true },
                    { "label": "BMP - Posterior", "value": "BMP - Posterior", "lock": true },
                    { "label": "Obturation + POR Posterior", "value": "Obturation + POR Posterior", "lock": true },
                    { "label": "RCO done", "value": "RCO done", "lock": true },
                    { "label": "BMP done", "value": "BMP done", "lock": true },
                    { "label": "Obturation + POR", "value": "Obturation + POR", "lock": true },
                    { "label": "Crown cutting", "value": "Crown cutting", "lock": true },
                    { "label": "Crown cementation", "value": "Crown cementation", "lock": true },
                    { "label": "FPD", "value": "FPD", "lock": true },
                    { "label": "Bridge cementation", "value": "Bridge cementation", "lock": true },
                    { "label": "Crown removal", "value": "Crown removal", "lock": true },
                    { "label": "Bridge try-in", "value": "Bridge try-in", "lock": true },
                    { "label": "GIC done", "value": "GIC done", "lock": true },
                    { "label": "Composite done", "value": "Composite done", "lock": true },
                    { "label": "Occlusal adjustment done", "value": "Occlusal adjustment done", "lock": true },
                    { "label": "Irrigation done", "value": "Irrigation done", "lock": true },
                    { "label": "Mobile extraction done", "value": "Mobile extraction done", "lock": true },
                    { "label": "Simple extraction done", "value": "Simple extraction done", "lock": true },
                    { "label": "Complex extraction done", "value": "Complex extraction done", "lock": true },
                    { "label": "Surgical extraction done", "value": "Surgical extraction done", "lock": true },
                    { "label": "Bond filling done", "value": "Bond filling done", "lock": true },
                    { "label": "Frenectomy", "value": "Frenectomy", "lock": true },
                    { "label": "Operculectomy done", "value": "Operculectomy done", "lock": true },
                    { "label": "Cusp guiding done", "value": "Cusp guiding done", "lock": true },
                    { "label": "Finishing + Polishing", "value": "Finishing + Polishing", "lock": true },
                    { "label": "Tooth Bleaching", "value": "Tooth Bleaching", "lock": true },
                    { "label": "Scaling + Polishing (Prophylaxis)", "value": "Scaling + Polishing (Prophylaxis)", "lock": true },
                    { "label": "Post n Core done", "value": "Post n Core done", "lock": true },
                    { "label": "Composite buildup done", "value": "Composite buildup done", "lock": true },
                    { "label": "POR done", "value": "POR done", "lock": true },
                    { "label": "Fluoride application", "value": "Fluoride application", "lock": true },
                    { "label": "Fluoride varnish", "value": "Fluoride varnish", "lock": true },
                    { "label": "Pit & fissure sealant", "value": "Pit & fissure sealant", "lock": true },
                    { "label": "Pulpotomy - 1st appointment", "value": "Pulpotomy - 1st appointment", "lock": true },
                    { "label": "Pulpotomy - 2nd appointment", "value": "Pulpotomy - 2nd appointment", "lock": true },
                    { "label": "Pulpotomy - 3rd appointment", "value": "Pulpotomy - 3rd appointment", "lock": true },
                    { "label": "GIC + dycal", "value": "GIC + dycal", "lock": true },
                    { "label": "Composite + GIC", "value": "Composite + GIC", "lock": true },
                    { "label": "Composite + Ca(OH)₂", "value": "Composite + Ca(OH)₂", "lock": true },
                    { "label": "Composite + LC-Cal", "value": "Composite + LC-Cal", "lock": true },
                    { "label": "RC-Cal placed", "value": "RC-Cal placed", "lock": true }
                ]
            }
        ]',
        NOW (),
        NOW ()
    );