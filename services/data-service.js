/**
 * ============================================================
 * EEMS — DATA SERVICE
 * Electrical & Energy Management System
 * ============================================================
 *
 * File    : EEMS/services/data-service.js
 * Version : 1.0
 *
 * Fungsi utama:
 * 1. Central Data Integration Layer
 * 2. Registry entity EEMS
 * 3. Validasi field berdasarkan Data Dictionary
 * 4. Standardisasi status data
 * 5. CRUD sederhana berbasis localStorage
 * 6. Query dan agregasi data
 * 7. Audit trail dasar
 * 8. KPI source mapping
 * 9. Persiapan migrasi ke API / Database
 *
 * Arsitektur:
 *
 * MODULE
 *    ↓
 * DATA SERVICE
 *    ↓
 * VALIDATION
 *    ↓
 * DATA CENTER
 *    ↓
 * KPI ENGINE
 *    ↓
 * DASHBOARD
 *    ↓
 * MANAGEMENT REPORT
 *
 * Catatan:
 * - Tidak menggunakan framework.
 * - Tidak membutuhkan library eksternal.
 * - Tidak membuat field yang tidak terdapat pada Data Dictionary.
 * - HS-02, PR-02 dan cost_transaction belum dianggap sebagai
 *   entity aktif karena belum didefinisikan dalam Dictionary.
 *
 * ============================================================
 */

(function (window) {
    "use strict";

    /* =========================================================
       CONFIGURATION
    ========================================================= */

    const CONFIG = {
        version: "1.0",
        storagePrefix: "EEMS_DATA_",
        auditStorageKey: "EEMS_AUDIT_TRAIL",
        initializedKey: "EEMS_DATA_SERVICE_INITIALIZED",

        lifecycle: [
            "DRAFT",
            "SUBMITTED",
            "VALIDATED",
            "APPROVED",
            "ACTIVE",
            "CLOSED",
            "ARCHIVED"
        ],

        dataQuality: [
            "COMPLETENESS",
            "VALIDITY",
            "CONSISTENCY",
            "UNIQUENESS",
            "TRACEABILITY"
        ]
    };


    /* =========================================================
       DATA DICTIONARY REGISTRY
       Exact entities and fields from EEMS Data Dictionary
    ========================================================= */

    const DICTIONARY = {

        /* -----------------------------------------------------
           MASTER DATA
        ----------------------------------------------------- */

        asset: {
            code: "MD-01",
            name: "Asset",
            category: "MASTER",
            fields: {
                asset_id: ["VARCHAR", true],
                asset_name: ["VARCHAR", true],
                asset_type: ["VARCHAR", true],
                asset_category: ["VARCHAR", true],
                location_id: ["VARCHAR", true],
                manufacturer: ["VARCHAR", false],
                model: ["VARCHAR", false],
                serial_number: ["VARCHAR", false],
                installation_date: ["DATE", false],
                commission_date: ["DATE", false],
                criticality: ["VARCHAR", true],
                status: ["VARCHAR", true],
                owner_id: ["VARCHAR", true]
            },
            primaryKey: "asset_id"
        },

        person: {
            code: "MD-02",
            name: "Person",
            category: "MASTER",
            fields: {
                person_id: ["VARCHAR", true],
                name: ["VARCHAR", true],
                organization_id: ["VARCHAR", true],
                position: ["VARCHAR", true],
                department: ["VARCHAR", true],
                competency: ["TEXT", false],
                qualification: ["TEXT", false],
                authorization: ["TEXT", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "person_id"
        },

        location: {
            code: "MD-03",
            name: "Location",
            category: "MASTER",
            fields: {
                location_id: ["VARCHAR", true],
                location_name: ["VARCHAR", true],
                site: ["VARCHAR", true],
                building: ["VARCHAR", false],
                area: ["VARCHAR", false],
                room: ["VARCHAR", false],
                parent_location_id: ["VARCHAR", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "location_id"
        },

        partner: {
            code: "MD-04",
            name: "Vendor / Business Partner",
            category: "MASTER",
            fields: {
                partner_id: ["VARCHAR", true],
                partner_name: ["VARCHAR", true],
                partner_type: ["VARCHAR", true],
                contact: ["VARCHAR", false],
                address: ["TEXT", false],
                service_category: ["VARCHAR", false],
                qualification: ["TEXT", false],
                contract_status: ["VARCHAR", true]
            },
            primaryKey: "partner_id"
        },

        organization: {
            code: "MD-05",
            name: "Organization",
            category: "MASTER",
            fields: {
                organization_id: ["VARCHAR", true],
                organization_name: ["VARCHAR", true],
                department: ["VARCHAR", false],
                section: ["VARCHAR", false],
                manager_id: ["VARCHAR", false],
                parent_organization_id: ["VARCHAR", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "organization_id"
        },

        parameter: {
            code: "MD-06",
            name: "Parameter",
            category: "MASTER",
            fields: {
                parameter_id: ["VARCHAR", true],
                parameter_name: ["VARCHAR", true],
                parameter_type: ["VARCHAR", true],
                unit: ["VARCHAR", false],
                minimum_value: ["DECIMAL", false],
                maximum_value: ["DECIMAL", false],
                target_value: ["DECIMAL", false],
                reference: ["VARCHAR", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "parameter_id"
        },


        /* -----------------------------------------------------
           TRANSACTION DATA
        ----------------------------------------------------- */

        measurement: {
            code: "EL-01",
            name: "Electrical Measurement",
            category: "TRANSACTION",
            fields: {
                measurement_id: ["VARCHAR", true],
                date_time: ["DATETIME", true],
                asset_id: ["VARCHAR", true],
                location_id: ["VARCHAR", true],
                voltage: ["DECIMAL", false],
                current: ["DECIMAL", false],
                power: ["DECIMAL", false],
                power_factor: ["DECIMAL", false],
                frequency: ["DECIMAL", false],
                energy: ["DECIMAL", false],
                meter_id: ["VARCHAR", false],
                operator_id: ["VARCHAR", false],
                data_status: ["VARCHAR", true]
            },
            primaryKey: "measurement_id"
        },

        energy: {
            code: "EN-01",
            name: "Energy Consumption",
            category: "TRANSACTION",
            fields: {
                energy_id: ["VARCHAR", true],
                date_time: ["DATETIME", true],
                meter_id: ["VARCHAR", true],
                location_id: ["VARCHAR", true],
                energy_type: ["VARCHAR", true],
                consumption_kwh: ["DECIMAL", true],
                demand_kw: ["DECIMAL", false],
                cost: ["DECIMAL", false],
                period: ["VARCHAR", true],
                data_status: ["VARCHAR", true]
            },
            primaryKey: "energy_id"
        },

        workOrder: {
            code: "MT-01",
            name: "Maintenance Work Order",
            category: "TRANSACTION",
            fields: {
                wo_id: ["VARCHAR", true],
                asset_id: ["VARCHAR", true],
                work_type: ["VARCHAR", true],
                priority: ["VARCHAR", true],
                request_date: ["DATE", true],
                planned_date: ["DATE", false],
                actual_date: ["DATE", false],
                technician_id: ["VARCHAR", false],
                work_description: ["TEXT", true],
                finding: ["TEXT", false],
                action: ["TEXT", false],
                cost: ["DECIMAL", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "wo_id"
        },

        risk: {
            code: "HS-01",
            name: "Risk",
            category: "TRANSACTION",
            fields: {
                risk_id: ["VARCHAR", true],
                process: ["VARCHAR", true],
                location_id: ["VARCHAR", true],
                hazard: ["TEXT", true],
                cause: ["TEXT", true],
                consequence: ["TEXT", true],
                likelihood: ["INTEGER", true],
                impact: ["INTEGER", true],
                risk_rating: ["INTEGER", true],
                existing_control: ["TEXT", false],
                treatment: ["TEXT", false],
                risk_owner_id: ["VARCHAR", true],
                due_date: ["DATE", false],
                residual_risk: ["INTEGER", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "risk_id"
        },

        project: {
            code: "PR-01",
            name: "Project",
            category: "TRANSACTION",
            fields: {
                project_id: ["VARCHAR", true],
                project_name: ["VARCHAR", true],
                project_manager_id: ["VARCHAR", true],
                start_date: ["DATE", true],
                target_date: ["DATE", true],
                budget: ["DECIMAL", true],
                actual_cost: ["DECIMAL", false],
                progress: ["DECIMAL", true],
                status: ["VARCHAR", true]
            },
            primaryKey: "project_id"
        },

        budget: {
            code: "FN-01",
            name: "Budget",
            category: "TRANSACTION",
            fields: {
                budget_id: ["VARCHAR", true],
                period: ["VARCHAR", true],
                cost_center: ["VARCHAR", true],
                category: ["VARCHAR", true],
                budget_amount: ["DECIMAL", true],
                revised_budget: ["DECIMAL", false],
                actual_cost: ["DECIMAL", false],
                commitment: ["DECIMAL", false],
                variance: ["DECIMAL", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "budget_id"
        },

        competency: {
            code: "HR-01",
            name: "Competency",
            category: "TRANSACTION",
            fields: {
                competency_id: ["VARCHAR", true],
                person_id: ["VARCHAR", true],
                competency: ["VARCHAR", true],
                required_level: ["INTEGER", true],
                actual_level: ["INTEGER", false],
                qualification: ["TEXT", false],
                expiry_date: ["DATE", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "competency_id"
        },


        /* -----------------------------------------------------
           CONTROL LAYER
        ----------------------------------------------------- */

        document: {
            code: "DC",
            name: "Document Control",
            category: "CONTROL",
            fields: {
                document_id: ["VARCHAR", true],
                document_number: ["VARCHAR", true],
                title: ["VARCHAR", true],
                document_type: ["VARCHAR", true],
                revision: ["VARCHAR", true],
                owner_id: ["VARCHAR", true],
                approval: ["VARCHAR", true],
                issue_date: ["DATE", true],
                review_date: ["DATE", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "document_id"
        },

        audit: {
            code: "AC",
            name: "Audit",
            category: "CONTROL",
            fields: {
                audit_id: ["VARCHAR", true],
                audit_program: ["VARCHAR", true],
                scope: ["TEXT", true],
                criteria: ["TEXT", true],
                finding: ["TEXT", false],
                classification: ["VARCHAR", false],
                owner_id: ["VARCHAR", false],
                due_date: ["DATE", false],
                effectiveness: ["TEXT", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "audit_id"
        },

        correctiveAction: {
            code: "CI",
            name: "Corrective Action / Improvement",
            category: "CONTROL",
            fields: {
                action_id: ["VARCHAR", true],
                source: ["VARCHAR", true],
                finding: ["TEXT", true],
                action_type: ["VARCHAR", true],
                root_cause: ["TEXT", false],
                action: ["TEXT", true],
                owner_id: ["VARCHAR", true],
                due_date: ["DATE", true],
                verification: ["TEXT", false],
                effectiveness: ["TEXT", false],
                status: ["VARCHAR", true]
            },
            primaryKey: "action_id"
        }
    };


    /* =========================================================
       KPI SOURCE MAP
    ========================================================= */

    const KPI_MAP = {

        KPI_01: {
            code: "KPI 01",
            name: "Total Konsumsi Energi",
            sources: ["EN-01"],
            fields: ["consumption_kwh"]
        },

        KPI_02: {
            code: "KPI 02",
            name: "Beban Puncak",
            sources: ["EL-01", "EN-01"],
            fields: ["power", "demand_kw"]
        },

        KPI_03: {
            code: "KPI 03",
            name: "Ketersediaan Sistem",
            sources: ["EL-01", "MT-01"],
            fields: ["data_status", "status"]
        },

        KPI_04: {
            code: "KPI 04",
            name: "Backlog Pemeliharaan",
            sources: ["MT-01"],
            fields: ["status"]
        },

        KPI_05: {
            code: "KPI 05",
            name: "Insiden HSE / K3",
            sources: ["HS-02"],
            fields: [],
            available: false,
            reason: "HS-02 belum didefinisikan dalam Data Dictionary."
        },

        KPI_06: {
            code: "KPI 06",
            name: "Kemajuan Proyek",
            sources: ["PR-01", "PR-02"],
            fields: ["progress"],
            unavailableSources: ["PR-02"]
        },

        KPI_07: {
            code: "KPI 07",
            name: "Penyimpangan Anggaran",
            sources: ["FN-01"],
            fields: ["variance"]
        },

        KPI_08: {
            code: "KPI 08",
            name: "Kepatuhan Kompetensi",
            sources: ["HR-01"],
            fields: ["required_level", "actual_level"]
        },

        KPI_09: {
            code: "KPI 09",
            name: "Tindakan Korektif Terbuka",
            sources: ["CI"],
            fields: ["status"]
        }
    };


    /* =========================================================
       RELATION MAP
    ========================================================= */

    const RELATIONS = [
        {
            parent: "asset",
            child: "workOrder",
            parentField: "asset_id",
            childField: "asset_id"
        },
        {
            parent: "asset",
            child: "measurement",
            parentField: "asset_id",
            childField: "asset_id"
        },
        {
            parent: "location",
            child: "asset",
            parentField: "location_id",
            childField: "location_id"
        },
        {
            parent: "person",
            child: "competency",
            parentField: "person_id",
            childField: "person_id"
        },
        {
            parent: "project",
            child: "budget",
            parentField: "project_id",
            childField: "project_id",
            note: "Relasi langsung project_id belum tersedia pada FN-01 Budget."
        },
        {
            parent: "audit",
            child: "correctiveAction",
            parentField: "finding",
            childField: "source"
        }
    ];


    /* =========================================================
       INTERNAL HELPERS
    ========================================================= */

    function clone(data) {
        return JSON.parse(JSON.stringify(data));
    }


    function storageKey(entity) {
        return CONFIG.storagePrefix + entity.toUpperCase();
    }


    function now() {
        return new Date().toISOString();
    }


    function normalizeEntity(entity) {
        return String(entity || "").trim();
    }


    function getDefinition(entity) {
        const normalized = normalizeEntity(entity);

        if (!DICTIONARY[normalized]) {
            throw new Error(
                "Entity EEMS tidak ditemukan dalam Data Dictionary: " +
                normalized
            );
        }

        return DICTIONARY[normalized];
    }


    function getRecords(entity) {
        getDefinition(entity);

        const raw = localStorage.getItem(storageKey(entity));

        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error("EEMS Data Service: data storage rusak.", error);
            return [];
        }
    }


    function saveRecords(entity, records) {
        localStorage.setItem(
            storageKey(entity),
            JSON.stringify(records)
        );
    }


    function generateId(entity) {
        const definition = getDefinition(entity);

        const prefix = definition.code
            .replace(/[^A-Z0-9]/gi, "")
            .toUpperCase();

        return (
            prefix +
            "-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random().toString(36).substring(2, 7).toUpperCase()
        );
    }


    function isEmpty(value) {
        return (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
        );
    }


    function validateType(value, type) {

        if (isEmpty(value)) {
            return true;
        }

        switch (type) {

            case "VARCHAR":
            case "TEXT":
                return typeof value === "string";

            case "INTEGER":
                return (
                    Number.isInteger(value) ||
                    (
                        typeof value === "string" &&
                        /^-?\d+$/.test(value)
                    )
                );

            case "DECIMAL":
                return (
                    typeof value === "number" &&
                    Number.isFinite(value)
                ) || (
                    typeof value === "string" &&
                    value.trim() !== "" &&
                    Number.isFinite(Number(value))
                );

            case "DATE":
                return (
                    /^\d{4}-\d{2}-\d{2}$/.test(String(value))
                );

            case "DATETIME":
                return (
                    !Number.isNaN(Date.parse(value))
                );

            default:
                return true;
        }
    }


    function validateRecord(entity, record, options) {

        const definition = getDefinition(entity);
        const errors = [];
        const warnings = [];

        const data = record || {};
        const allowUnknownFields =
            options &&
            options.allowUnknownFields === true;


        /* -----------------------------------------------------
           Required field validation
        ----------------------------------------------------- */

        Object.keys(definition.fields).forEach(function (field) {

            const type = definition.fields[field][0];
            const required = definition.fields[field][1];
            const value = data[field];

            if (required && isEmpty(value)) {
                errors.push({
                    field: field,
                    code: "REQUIRED",
                    message: field + " wajib diisi."
                });

                return;
            }

            if (!isEmpty(value) && !validateType(value, type)) {
                errors.push({
                    field: field,
                    code: "INVALID_TYPE",
                    message:
                        field +
                        " harus bertipe " +
                        type +
                        "."
                });
            }
        });


        /* -----------------------------------------------------
           Unknown field validation
        ----------------------------------------------------- */

        if (!allowUnknownFields) {

            Object.keys(data).forEach(function (field) {

                if (
                    field === "_meta" ||
                    !definition.fields[field]
                ) {
                    if (field !== "_meta") {
                        errors.push({
                            field: field,
                            code: "UNKNOWN_FIELD",
                            message:
                                "Field " +
                                field +
                                " tidak terdapat dalam Data Dictionary."
                        });
                    }
                }
            });
        }


        /* -----------------------------------------------------
           Lifecycle validation
        ----------------------------------------------------- */

        if (
            data.status &&
            !CONFIG.lifecycle.includes(String(data.status).toUpperCase())
        ) {
            warnings.push({
                field: "status",
                code: "STATUS_STANDARDIZATION",
                message:
                    "Status akan dinormalisasi ke lifecycle EEMS."
            });
        }

        if (
            data.data_status &&
            !CONFIG.lifecycle.includes(
                String(data.data_status).toUpperCase()
            )
        ) {
            warnings.push({
                field: "data_status",
                code: "STATUS_STANDARDIZATION",
                message:
                    "data_status akan dinormalisasi ke lifecycle EEMS."
            });
        }


        return {
            valid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }


    function normalizeStatus(value) {

        if (isEmpty(value)) {
            return value;
        }

        const normalized = String(value)
            .trim()
            .toUpperCase();

        const aliases = {
            DRAFT: "DRAFT",
            SUBMITTED: "SUBMITTED",
            SUBMIT: "SUBMITTED",
            VALIDATED: "VALIDATED",
            VALIDATE: "VALIDATED",
            APPROVED: "APPROVED",
            APPROVE: "APPROVED",
            ACTIVE: "ACTIVE",
            OPEN: "ACTIVE",
            CLOSED: "CLOSED",
            CLOSE: "CLOSED",
            ARCHIVED: "ARCHIVED",
            ARCHIVE: "ARCHIVED"
        };

        return aliases[normalized] || normalized;
    }


    function normalizeRecord(entity, record) {

        const definition = getDefinition(entity);
        const source = clone(record || {});
        const result = {};

        Object.keys(definition.fields).forEach(function (field) {

            if (source[field] !== undefined) {

                const type = definition.fields[field][0];
                let value = source[field];

                if (
                    (field === "status" || field === "data_status") &&
                    typeof value === "string"
                ) {
                    value = normalizeStatus(value);
                }

                if (
                    (type === "INTEGER" || type === "DECIMAL") &&
                    typeof value === "string" &&
                    value.trim() !== ""
                ) {
                    value = Number(value);
                }

                result[field] = value;
            }
        });

        return result;
    }


    /* =========================================================
       AUDIT TRAIL
    ========================================================= */

    function getAuditTrail() {

        const raw =
            localStorage.getItem(CONFIG.auditStorageKey);

        if (!raw) {
            return [];
        }

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }


    function writeAudit(action, entity, recordId, details) {

        const audit = getAuditTrail();

        audit.push({
            audit_timestamp: now(),
            action: action,
            entity: entity,
            record_id: recordId || null,
            details: details || null
        });

        localStorage.setItem(
            CONFIG.auditStorageKey,
            JSON.stringify(audit)
        );
    }


    /* =========================================================
       PUBLIC API — INITIALIZATION
    ========================================================= */

    function initialize() {

        if (!localStorage.getItem(CONFIG.initializedKey)) {

            localStorage.setItem(
                CONFIG.initializedKey,
                now()
            );

            writeAudit(
                "INITIALIZE",
                "SYSTEM",
                null,
                {
                    version: CONFIG.version
                }
            );
        }

        return {
            success: true,
            version: CONFIG.version,
            initialized: true,
            timestamp: now()
        };
    }


    /* =========================================================
       PUBLIC API — ENTITY
    ========================================================= */

    function getEntities() {

        return Object.keys(DICTIONARY).map(function (key) {

            const definition = DICTIONARY[key];

            return {
                entity: key,
                code: definition.code,
                name: definition.name,
                category: definition.category,
                primaryKey: definition.primaryKey,
                fieldCount: Object.keys(
                    definition.fields
                ).length
            };
        });
    }


    function getDictionary(entity) {

        if (entity) {
            return clone(getDefinition(entity));
        }

        return clone(DICTIONARY);
    }


    /* =========================================================
       PUBLIC API — CREATE
    ========================================================= */

    function create(entity, record, options) {

        const definition = getDefinition(entity);

        const normalized = normalizeRecord(
            entity,
            record
        );

        const validation = validateRecord(
            entity,
            normalized,
            options
        );

        if (!validation.valid) {

            return {
                success: false,
                action: "CREATE",
                entity: entity,
                validation: validation
            };
        }


        const primaryKey =
            definition.primaryKey;

        if (isEmpty(normalized[primaryKey])) {
            normalized[primaryKey] =
                generateId(entity);
        }


        const records =
            getRecords(entity);

        const duplicate =
            records.some(function (item) {
                return (
                    item[primaryKey] ===
                    normalized[primaryKey]
                );
            });

        if (duplicate) {

            return {
                success: false,
                action: "CREATE",
                entity: entity,
                validation: {
                    valid: false,
                    errors: [
                        {
                            field: primaryKey,
                            code: "DUPLICATE",
                            message:
                                "ID " +
                                normalized[primaryKey] +
                                " sudah digunakan."
                        }
                    ],
                    warnings: []
                }
            };
        }


        records.push(normalized);

        saveRecords(
            entity,
            records
        );

        writeAudit(
            "CREATE",
            entity,
            normalized[primaryKey],
            normalized
        );


        return {
            success: true,
            action: "CREATE",
            entity: entity,
            record: clone(normalized),
            validation: validation
        };
    }


    /* =========================================================
       PUBLIC API — READ
    ========================================================= */

    function getAll(entity) {

        return clone(
            getRecords(entity)
        );
    }


    function getById(entity, id) {

        const definition =
            getDefinition(entity);

        const records =
            getRecords(entity);

        const record =
            records.find(function (item) {
                return (
                    item[definition.primaryKey] ===
                    id
                );
            });

        return record
            ? clone(record)
            : null;
    }


    function find(entity, predicate) {

        const records =
            getRecords(entity);

        if (typeof predicate !== "function") {
            return clone(records);
        }

        return clone(
            records.filter(predicate)
        );
    }


    function where(entity, field, value) {

        return find(
            entity,
            function (record) {
                return record[field] === value;
            }
        );
    }


    /* =========================================================
       PUBLIC API — UPDATE
    ========================================================= */

    function update(entity, id, changes, options) {

        const definition =
            getDefinition(entity);

        const records =
            getRecords(entity);

        const index =
            records.findIndex(function (item) {
                return (
                    item[definition.primaryKey] ===
                    id
                );
            });

        if (index === -1) {

            return {
                success: false,
                action: "UPDATE",
                entity: entity,
                message:
                    "Record tidak ditemukan."
            };
        }


        const merged =
            Object.assign(
                {},
                records[index],
                changes || {}
            );

        const normalized =
            normalizeRecord(
                entity,
                merged
            );

        const validation =
            validateRecord(
                entity,
                normalized,
                options
            );

        if (!validation.valid) {

            return {
                success: false,
                action: "UPDATE",
                entity: entity,
                validation: validation
            };
        }


        normalized[definition.primaryKey] = id;

        records[index] = normalized;

        saveRecords(
            entity,
            records
        );

        writeAudit(
            "UPDATE",
            entity,
            id,
            changes
        );


        return {
            success: true,
            action: "UPDATE",
            entity: entity,
            record: clone(normalized),
            validation: validation
        };
    }


    /* =========================================================
       PUBLIC API — DELETE
    ========================================================= */

    function remove(entity, id) {

        const definition =
            getDefinition(entity);

        const records =
            getRecords(entity);

        const index =
            records.findIndex(function (item) {
                return (
                    item[definition.primaryKey] ===
                    id
                );
            });

        if (index === -1) {

            return {
                success: false,
                action: "DELETE",
                entity: entity,
                message:
                    "Record tidak ditemukan."
            };
        }


        const removed =
            records.splice(index, 1)[0];

        saveRecords(
            entity,
            records
        );

        writeAudit(
            "DELETE",
            entity,
            id,
            removed
        );


        return {
            success: true,
            action: "DELETE",
            entity: entity,
            record: clone(removed)
        };
    }


    /* =========================================================
       PUBLIC API — VALIDATION
    ========================================================= */

    function validate(entity, record, options) {

        const normalized =
            normalizeRecord(
                entity,
                record
            );

        return validateRecord(
            entity,
            normalized,
            options
        );
    }


    /* =========================================================
       PUBLIC API — DATA QUALITY
    ========================================================= */

    function quality(entity) {

        const definition =
            getDefinition(entity);

        const records =
            getRecords(entity);

        const fields =
            Object.keys(
                definition.fields
            );

        let requiredTotal = 0;
        let requiredFilled = 0;
        let invalidTotal = 0;

        records.forEach(function (record) {

            fields.forEach(function (field) {

                const type =
                    definition.fields[field][0];

                const required =
                    definition.fields[field][1];

                const value =
                    record[field];

                if (required) {

                    requiredTotal++;

                    if (!isEmpty(value)) {
                        requiredFilled++;
                    }
                }

                if (
                    !isEmpty(value) &&
                    !validateType(value, type)
                ) {
                    invalidTotal++;
                }
            });
        });


        const completeness =
            requiredTotal === 0
                ? 100
                : (
                    requiredFilled /
                    requiredTotal
                ) * 100;

        const validity =
            records.length === 0
                ? 100
                : Math.max(
                    0,
                    100 -
                    (
                        invalidTotal /
                        (
                            records.length *
                            fields.length
                        )
                    ) *
                    100
                );


        const uniqueIds =
            new Set(
                records.map(function (record) {
                    return record[
                        definition.primaryKey
                    ];
                })
            ).size;

        const uniqueness =
            records.length === 0
                ? 100
                : (
                    uniqueIds /
                    records.length
                ) * 100;


        return {
            entity: entity,
            recordCount: records.length,
            completeness: Number(
                completeness.toFixed(2)
            ),
            validity: Number(
                validity.toFixed(2)
            ),
            uniqueness: Number(
                uniqueness.toFixed(2)
            ),
            consistency: 100,
            traceability: 100,
            qualityScore: Number(
                (
                    (
                        completeness +
                        validity +
                        uniqueness +
                        100 +
                        100
                    ) / 5
                ).toFixed(2)
            )
        };
    }


    /* =========================================================
       PUBLIC API — RELATION
    ========================================================= */

    function getRelations() {
        return clone(RELATIONS);
    }


    function related(
        parentEntity,
        parentId,
        childEntity
    ) {

        const relation =
            RELATIONS.find(function (item) {

                return (
                    item.parent === parentEntity &&
                    item.child === childEntity
                );
            });

        if (!relation) {
            return [];
        }


        const parent =
            getById(
                parentEntity,
                parentId
            );

        if (!parent) {
            return [];
        }


        return where(
            childEntity,
            relation.childField,
            parent[relation.parentField]
        );
    }


    /* =========================================================
       PUBLIC API — KPI
    ========================================================= */

    function getKPIMap() {
        return clone(KPI_MAP);
    }


    function getKPI(code) {

        return KPI_MAP[code]
            ? clone(KPI_MAP[code])
            : null;
    }


    function calculateKPI(code) {

        const definition =
            KPI_MAP[code];

        if (!definition) {

            return {
                success: false,
                message:
                    "KPI tidak ditemukan."
            };
        }


        switch (code) {

            /* ---------------------------------------------
               KPI 01 — Total Konsumsi Energi
            --------------------------------------------- */

            case "KPI_01": {

                const records =
                    getRecords("energy");

                const total =
                    records.reduce(
                        function (sum, record) {

                            return (
                                sum +
                                Number(
                                    record.consumption_kwh ||
                                    0
                                )
                            );

                        },
                        0
                    );

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: Number(
                        total.toFixed(2)
                    ),
                    unit: "kWh",
                    source: "EN-01",
                    recordCount: records.length
                };
            }


            /* ---------------------------------------------
               KPI 02 — Beban Puncak
            --------------------------------------------- */

            case "KPI_02": {

                const energyRecords =
                    getRecords("energy");

                const measurementRecords =
                    getRecords("measurement");

                const energyDemand =
                    energyRecords.map(
                        function (record) {
                            return Number(
                                record.demand_kw || 0
                            );
                        }
                    );

                const measuredPower =
                    measurementRecords.map(
                        function (record) {
                            return Number(
                                record.power || 0
                            );
                        }
                    );

                const values =
                    energyDemand.concat(
                        measuredPower
                    );

                const peak =
                    values.length
                        ? Math.max.apply(
                            null,
                            values
                        )
                        : 0;

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: Number(
                        peak.toFixed(2)
                    ),
                    unit: "kW",
                    source: [
                        "EL-01",
                        "EN-01"
                    ]
                };
            }


            /* ---------------------------------------------
               KPI 03 — Ketersediaan Sistem
            --------------------------------------------- */

            case "KPI_03": {

                const records =
                    getRecords("workOrder");

                const total =
                    records.length;

                const completed =
                    records.filter(
                        function (record) {
                            return (
                                normalizeStatus(
                                    record.status
                                ) === "CLOSED"
                            );
                        }
                    ).length;

                const availability =
                    total === 0
                        ? 100
                        : (
                            completed /
                            total
                        ) * 100;

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: Number(
                        availability.toFixed(2)
                    ),
                    unit: "%",
                    source: [
                        "EL-01",
                        "MT-01"
                    ],
                    note:
                        "Perhitungan awal berbasis data yang tersedia."
                };
            }


            /* ---------------------------------------------
               KPI 04 — Backlog Pemeliharaan
            --------------------------------------------- */

            case "KPI_04": {

                const records =
                    getRecords("workOrder");

                const backlog =
                    records.filter(
                        function (record) {

                            const status =
                                normalizeStatus(
                                    record.status
                                );

                            return (
                                status !== "CLOSED" &&
                                status !== "ARCHIVED"
                            );
                        }
                    ).length;

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: backlog,
                    unit: "WO",
                    source: "MT-01"
                };
            }


            /* ---------------------------------------------
               KPI 05 — HS-02 belum tersedia
            --------------------------------------------- */

            case "KPI_05":

                return {
                    success: false,
                    code: definition.code,
                    name: definition.name,
                    value: null,
                    unit: null,
                    available: false,
                    source: "HS-02",
                    message:
                        "KPI belum dapat dihitung karena HS-02 belum didefinisikan dalam Data Dictionary."
                };


            /* ---------------------------------------------
               KPI 06 — Kemajuan Proyek
            --------------------------------------------- */

            case "KPI_06": {

                const records =
                    getRecords("project");

                if (!records.length) {

                    return {
                        success: true,
                        code: definition.code,
                        name: definition.name,
                        value: 0,
                        unit: "%",
                        source: "PR-01",
                        unavailableSources: [
                            "PR-02"
                        ]
                    };
                }

                const total =
                    records.reduce(
                        function (sum, record) {

                            return (
                                sum +
                                Number(
                                    record.progress || 0
                                )
                            );

                        },
                        0
                    );

                const average =
                    total / records.length;

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: Number(
                        average.toFixed(2)
                    ),
                    unit: "%",
                    source: "PR-01",
                    unavailableSources: [
                        "PR-02"
                    ],
                    recordCount: records.length
                };
            }


            /* ---------------------------------------------
               KPI 07 — Penyimpangan Anggaran
            --------------------------------------------- */

            case "KPI_07": {

                const records =
                    getRecords("budget");

                const totalVariance =
                    records.reduce(
                        function (sum, record) {

                            if (
                                record.variance !==
                                undefined
                            ) {
                                return (
                                    sum +
                                    Number(
                                        record.variance ||
                                        0
                                    )
                                );
                            }

                            const budget =
                                Number(
                                    record.revised_budget ??
                                    record.budget_amount ??
                                    0
                                );

                            const actual =
                                Number(
                                    record.actual_cost ||
                                    0
                                );

                            return (
                                sum +
                                (
                                    budget -
                                    actual
                                )
                            );

                        },
                        0
                    );

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: Number(
                        totalVariance.toFixed(2)
                    ),
                    unit: "CURRENCY",
                    source: "FN-01",
                    recordCount: records.length
                };
            }


            /* ---------------------------------------------
               KPI 08 — Kepatuhan Kompetensi
            --------------------------------------------- */

            case "KPI_08": {

                const records =
                    getRecords("competency");

                if (!records.length) {

                    return {
                        success: true,
                        code: definition.code,
                        name: definition.name,
                        value: 0,
                        unit: "%",
                        source: "HR-01"
                    };
                }

                const compliant =
                    records.filter(
                        function (record) {

                            return (
                                record.actual_level !==
                                undefined &&
                                Number(
                                    record.actual_level
                                ) >= Number(
                                    record.required_level
                                )
                            );
                        }
                    ).length;

                const percentage =
                    (
                        compliant /
                        records.length
                    ) * 100;

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: Number(
                        percentage.toFixed(2)
                    ),
                    unit: "%",
                    source: "HR-01",
                    recordCount: records.length
                };
            }


            /* ---------------------------------------------
               KPI 09 — Tindakan Korektif Terbuka
            --------------------------------------------- */

            case "KPI_09": {

                const records =
                    getRecords("correctiveAction");

                const open =
                    records.filter(
                        function (record) {

                            const status =
                                normalizeStatus(
                                    record.status
                                );

                            return (
                                status !== "CLOSED" &&
                                status !== "ARCHIVED"
                            );
                        }
                    ).length;

                return {
                    success: true,
                    code: definition.code,
                    name: definition.name,
                    value: open,
                    unit: "ACTION",
                    source: "CI",
                    recordCount: records.length
                };
            }


            default:

                return {
                    success: false,
                    message:
                        "KPI belum memiliki calculation engine."
                };
        }
    }


    /* =========================================================
       PUBLIC API — DASHBOARD SUMMARY
    ========================================================= */

    function getDashboardSummary() {

        const summary = {
            generatedAt: now(),
            entities: {},
            kpi: {},
            quality: {}
        };


        Object.keys(DICTIONARY).forEach(
            function (entity) {

                summary.entities[entity] =
                    getRecords(entity).length;

                summary.quality[entity] =
                    quality(entity);
            }
        );


        Object.keys(KPI_MAP).forEach(
            function (code) {

                summary.kpi[code] =
                    calculateKPI(code);
            }
        );


        return summary;
    }


    /* =========================================================
       PUBLIC API — AUDIT TRAIL
    ========================================================= */

    function getAudit() {
        return clone(
            getAuditTrail()
        );
    }


    function clearAudit() {

        localStorage.removeItem(
            CONFIG.auditStorageKey
        );

        return {
            success: true
        };
    }


    /* =========================================================
       PUBLIC API — STORAGE
    ========================================================= */

    function clearEntity(entity) {

        getDefinition(entity);

        localStorage.removeItem(
            storageKey(entity)
        );

        writeAudit(
            "CLEAR_ENTITY",
            entity,
            null,
            null
        );

        return {
            success: true,
            entity: entity
        };
    }


    function clearAllData() {

        Object.keys(DICTIONARY).forEach(
            function (entity) {

                localStorage.removeItem(
                    storageKey(entity)
                );
            }
        );

        writeAudit(
            "CLEAR_ALL_DATA",
            "SYSTEM",
            null,
            null
        );

        return {
            success: true,
            message:
                "Seluruh data EEMS berhasil dikosongkan."
        };
    }


    /* =========================================================
       PUBLIC API — EXPORT / IMPORT
    ========================================================= */

    function exportData() {

        const payload = {
            system: "EEMS",
            serviceVersion: CONFIG.version,
            exportedAt: now(),
            dictionary: getEntities(),
            data: {}
        };


        Object.keys(DICTIONARY).forEach(
            function (entity) {

                payload.data[entity] =
                    getAll(entity);
            }
        );


        payload.auditTrail =
            getAudit();


        return payload;
    }


    function importData(payload, options) {

        if (
            !payload ||
            typeof payload !== "object" ||
            !payload.data
        ) {
            return {
                success: false,
                message:
                    "Format import EEMS tidak valid."
            };
        }


        const results = [];

        Object.keys(payload.data).forEach(
            function (entity) {

                if (!DICTIONARY[entity]) {

                    results.push({
                        entity: entity,
                        success: false,
                        message:
                            "Entity tidak dikenal dan tidak diimport."
                    });

                    return;
                }


                const records =
                    Array.isArray(
                        payload.data[entity]
                    )
                        ? payload.data[entity]
                        : [];


                records.forEach(
                    function (record) {

                        const result =
                            create(
                                entity,
                                record,
                                options
                            );

                        results.push({
                            entity: entity,
                            success:
                                result.success,
                            record:
                                result.record || null,
                            validation:
                                result.validation || null
                        });
                    }
                );
            }
        );


        return {
            success: results.every(
                function (item) {
                    return item.success;
                }
            ),
            importedAt: now(),
            results: results
        };
    }


    /* =========================================================
       PUBLIC API OBJECT
    ========================================================= */

    const EEMSDataService = {

        /* System */
        config: clone(CONFIG),
        initialize: initialize,

        /* Dictionary */
        dictionary: getDictionary,
        entities: getEntities,

        /* CRUD */
        create: create,
        getAll: getAll,
        getById: getById,
        find: find,
        where: where,
        update: update,
        remove: remove,

        /* Validation */
        validate: validate,
        quality: quality,

        /* Relations */
        relations: getRelations,
        related: related,

        /* KPI */
        kpiMap: getKPIMap,
        getKPI: getKPI,
        calculateKPI: calculateKPI,

        /* Dashboard */
        dashboardSummary: getDashboardSummary,

        /* Audit */
        audit: getAudit,
        clearAudit: clearAudit,

        /* Storage */
        clearEntity: clearEntity,
        clearAllData: clearAllData,

        /* Import / Export */
        export: exportData,
        import: importData
    };


    /* =========================================================
       GLOBAL REGISTRATION
    ========================================================= */

    window.EEMSDataService =
        EEMSDataService;


    /* =========================================================
       AUTO INITIALIZATION
    ========================================================= */

    initialize();


    /* =========================================================
       DEVELOPMENT CONSOLE
    ========================================================= */

    if (
        typeof console !== "undefined" &&
        typeof console.info === "function"
    ) {

        console.info(
            "EEMS Data Service v" +
            CONFIG.version +
            " aktif."
        );

        console.info(
            "Entities:",
            Object.keys(DICTIONARY)
        );
    }

})(window);
