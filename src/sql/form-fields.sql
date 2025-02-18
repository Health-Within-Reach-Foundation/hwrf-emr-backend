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

-- Inserting for 'GP  Form'
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
        'GP Form',
        '[
            { 
                "fieldName": "complaints", 
                "type": "select", 
                "options": [
                    {"label" : "Fever", "value": "Fever", "lock": true},
                    {"label" : "Cough", "value": "Cough", "lock": true},
                    {"label" : "Cold", "value": "Cold", "lock": true},
                    {"label" : "Loose motion", "value": "Loose motion", "lock": true},
                    {"label" : "Constipation", "value": "Constipation", "lock": true},
                    {"label" : "Vomiting", "value": "Vomiting", "lock": true},
                    {"label" : "Abdominal pain", "value": "Abdominal pain", "lock": true},
                    {"label" : "Knee/Joint pain", "value": "Knee/Joint pain", "lock": true},
                    {"label" : "Headache", "value": "Headache", "lock": true}
                ]
            },
            {
                "fieldName": "kco",
                "type": "checkbox",
                "options": [
                    {"label" : "Hypothyroidism", "value": "Hypothyroidism", "lock": true},
                    {"label" : "Hyperthyroidism", "value": "Hyperthyroidism", "lock": true},
                    {"label" : "Asthma", "value": "Asthma", "lock": true},
                    {"label" : "Epilepsy", "value": "Epilepsy", "lock": true}
                ]
            },
            {
                "fieldName": "findings",
                "type" : "checkbox",
                "options" : [
                    { "label" : "Temperature" , "value": "Temperature", "lock": true},
                    { "label" : "BP" , "value": "BP", "lock": true},
                    { "label" : "Pulse rate" , "value": "Pulse rate", "lock": true},
                    { "label" : "Respiratory rate" , "value": "Respiratory rate", "lock": true},
                    { "label" : "General examination" , "value": "General examination", "lock": true},
                    { "label" : "Skin lesion" , "value": "Skin lesion", "lock": true}   
                ]
            },
            {   
                "fieldName": "systemicExamination",
                "type": "checkbox",
                "options" : [
                    { "label" : "CNS" , "value": "CNS", "lock": true},
                    { "label" : "Respiratory" , "value": "Respiratory", "lock": true},
                    { "label" : "Cardio vascular" , "value": "Cardio vascular", "lock": true},
                    { "label" : "Per abdominal examination" , "value": "Per abdominal examination", "lock": true}
                ]
            },
            {
                "fieldName": "medicineType",
                "type": "select",
                "options": [
                    { "label": "Tablet", "value": "Tablet", "lock": true },
                    { "label": "Capsule", "value": "Capsule", "lock": true },
                    { "label": "Syrup", "value": "Syrup", "lock": true },
                    { "label": "Injection", "value": "Injection", "lock": true },
                    { "label": "Ointment", "value": "Ointment", "lock": true },
                    { "label": "Drops", "value": "Drops", "lock": true },
                    { "label": "Cream", "value": "Cream", "lock": true },
                    { "label": "Gel", "value": "Gel", "lock": true },
                    { "label": "Powder", "value": "Powder", "lock": true },
                    { "label": "Lotion", "value": "Lotion", "lock": true },
                    { "label": "Mouthwash", "value": "Mouthwash", "lock": true },
                    { "label": "Inhaler", "value": "Inhaler", "lock": true },
                    { "label": "Spray", "value": "Spray", "lock": true },
                    { "label": "Lozenges", "value": "Lozenges", "lock": true },
                    { "label": "Sachet", "value": "Sachet", "lock": true },
                    { "label": "Kit", "value": "Kit", "lock": true },
                    { "label": "Aerosol", "value": "Aerosol", "lock": true },
                    { "label": "Paste", "value": "Paste", "lock": true },
                    { "label": "Solution", "value": "Solution", "lock": true }
                ]
            },
            { 
                "fieldName": "medicine", 
                "type": "select", 
                "options": [
                    { "label": "Paracetamol", "value": "Paracetamol", "lock": true },
                    { "label": "Ibuprofen", "value": "Ibuprofen", "lock": true },
                    { "label": "Amoxicillin", "value": "Amoxicillin", "lock": true },
                    { "label": "Ciprofloxacin", "value": "Ciprofloxacin", "lock": true },
                    { "label": "Metronidazole", "value": "Metronidazole", "lock": true },
                    { "label": "Chlorhexidine", "value": "Chlorhexidine", "lock": true },
                    { "label": "Lignocaine", "value": "Lignocaine", "lock": true },
                    { "label": "Doxycycline", "value": "Doxycycline", "lock": true },
                    { "label": "Clindamycin", "value": "Clindamycin", "lock": true },
                    { "label": "Diclofenac", "value": "Diclofenac", "lock": true },
                    { "label": "Tramadol", "value": "Tramadol", "lock": true },
                    { "label": "Ketorolac", "value": "Ketorolac", "lock": true },
                    { "label": "Dexamethasone", "value": "Dexamethasone", "lock": true },
                    { "label": "Prednisolone", "value": "Prednisolone", "lock": true },
                    { "label": "Naproxen", "value": "Naproxen", "lock": true },
                    { "label": "Aspirin", "value": "Aspirin", "lock": true },
                    { "label": "Piroxicam", "value": "Piroxicam", "lock": true },
                    { "label": "Mefenamic acid", "value": "Mefenamic acid", "lock": true },
                    { "label": "Paracetamol + Ibuprofen", "value": "Paracetamol + Ibuprofen", "lock": true }
                ]
            },
            {
                "fieldName": "medicineDose",
                "type": "select",
                "options": [
                    { "label": "1 —— 0 —— 1", "value": "1 —— 0 —— 1", "lock": true },
                    { "label": "1 —— 1 —— 1", "value": "1 —— 1 —— 1", "lock": true },
                    { "label": "1 —— 1 —— 0", "value": "1 —— 1 —— 0", "lock": true },
                    { "label": "1 —— 0 —— 0", "value": "1 —— 0 —— 0", "lock": true },
                    { "label": "0 —— 1 —— 1", "value": "0 —— 1 —— 1", "lock": true },
                    { "label": "1 —— 1 —— 0 —— 1", "value": "1 —— 1 —— 0 —— 1", "lock": true },
                    { "label": "0 —— 1 —— 0", "value": "0 —— 1 —— 0", "lock": true },
                    { "label": "1 —— 0 —— 1 —— 0", "value": "1 —— 0 —— 1 —— 0", "lock": true },
                    { "label": "0 —— 0 —— 1 —— 0", "value": "0 —— 0 —— 1 —— 0", "lock": true },
                    { "label": "1 —— 1 —— 1 —— 1", "value": "1 —— 1 —— 1 —— 1", "lock": true },
                    { "label": "0 —— 0 —— 0 —— 1", "value": "0 —— 0 —— 0 —— 1", "lock": true },
                    { "label": "1 —— 2 —— 1", "value": "1 —— 2 —— 1", "lock": true },
                    { "label": "2 —— 0 —— 2", "value": "2 —— 0 —— 2", "lock": true },
                    { "label": "0 —— 1 —— 2", "value": "0 —— 1 —— 2", "lock": true }
                ]
            },
            {
                "fieldName": "medicineWhen",
                "type": "select",
                "options": [
                    { "label": "Before food", "value": "Before food", "lock": true },
                    { "label": "After food", "value": "After food", "lock": true },
                    { "label": "With food", "value": "With food", "lock": true },
                    { "label": "Empty stomach", "value": "Empty stomach", "lock": true },
                    { "label": "Before Bed", "value": "Before Bed", "lock": true },
                    { "label": "Anytime", "value": "Anytime", "lock": true }
                ]
            },
            {
                "fieldName": "medicineFrequency",
                "type": "select",
                "options": [
                    { "label": "Once a Day", "value": "Once a Day", "lock": true },
                    { "label": "Twice a Day", "value": "Twice a Day", "lock": true },
                    { "label": "Thrice a Day", "value": "Thrice a Day", "lock": true },
                    { "label": "Four Times a Day", "value": "Four Times a Day", "lock": true },
                    { "label": "Once a Week", "value": "Once a Week", "lock": true },
                    { "label": "Twice a Week", "value": "Twice a Week", "lock": true },
                    { "label": "Thrice a Week", "value": "Thrice a Week", "lock": true },
                    { "label": "Once a Month", "value": "Once a Month", "lock": true }
                ]
            },
            {
                "fieldName": "medicineDuration",
                "type": "select",
                "options": [
                    { "label": "3 Days", "value": "3 Days", "lock": true },
                    { "label": "5 Days", "value": "5 Days", "lock": true },
                    { "label": "7 Days", "value": "7 Days", "lock": true },
                    { "label": "10 Days", "value": "10 Days", "lock": true },
                    { "label": "15 Days", "value": "15 Days", "lock": true },
                    { "label": "1 Month", "value": "1 Month", "lock": true },
                    { "label": "2 Months", "value": "2 Months", "lock": true },
                    { "label": "3 Months", "value": "3 Months", "lock": true },
                    { "label": "6 Months", "value": "6 Months", "lock": true }
                ]
            }
        ]',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );