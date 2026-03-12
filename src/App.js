import { useState, useMemo } from 'react';
import {
  Database, Workflow, ShieldCheck, Zap,
  Search, BarChart3,
  Scale, ShieldAlert, Rocket,
  Construction, ActivitySquare, TerminalSquare,
  ChevronDown, ChevronUp, DollarSign, Key, Wrench,
  Scan, Boxes, Globe, Layers, Activity, Terminal, ExternalLink, Lock, X
} from 'lucide-react';

const tools = {
  storage: [
    {
      id: 'bigquery',
      name: 'BigQuery',
      type: 'Warehouse (OLAP)',
      managed: 'Serverless',
      scaling: 'Slot-based (Autoscaling)',
      tags: ['sql', 'serverless', 'saas', 'managed', 'no-ops', 'batch', 'real-time'],
      pde_snippet: 'Separation of storage/compute is core. Partitioning (date/int) and Clustering (sorting) are mandatory for cost/perf. BigLake queries GCS/S3 data without movement.',
      best_for: 'Petabyte-scale analytics, BQML, Analytics Hub, Omni (Multi-cloud).',
      url: 'https://cloud.google.com/bigquery/docs',
      details: {
        cost: 'On-demand ($6.25/TB) or Capacity-based. Storage: Active vs. Long-term (50% cheaper if idle > 90 days).',
        coding: 'Low-code (SQL). Heavy-code (Python/Java SDKs). No-code (Data Canvas).',
        availability: '99.99% SLA. Multi-regional for durability. Regional for compliance.',
        iam: 'roles/bigquery.jobUser (to run), roles/bigquery.dataViewer (to see).',
        os_equiv: 'Apache Drill, Impala, Presto.',
        trouble: 'quotaExceeded (Project limits) or rateLimitExceeded (DML frequency).'
      }
    },
    {
      id: 'gcs',
      name: 'Cloud Storage',
      type: 'Object Storage',
      managed: 'Fully Managed',
      scaling: 'Automatic',
      tags: ['serverless', 'managed', 'no-ops', 'batch'],
      pde_snippet: 'Classes: Standard, Nearline, Coldline, Archive. Use Lifecycle Management. Signed URLs for temp access. Naming randomness (sharding) aids throughput.',
      best_for: 'Data lakes, static assets, staging for BigQuery.',
      url: 'https://cloud.google.com/storage/docs',
      details: {
        cost: 'Storage Class ($/GB) + Operations + Egress. Archive retrieval is expensive.',
        coding: 'No-code (Console/CLI). Heavy-code (SDKs).',
        availability: '99.9% to 99.99% depending on class.',
        iam: 'roles/storage.objectViewer, roles/storage.objectAdmin.',
        os_equiv: 'AWS S3, Azure Blob.',
        trouble: '403 Forbidden: Check ACLs vs IAM; Uniform Bucket-Level Access recommended.'
      }
    },
    {
      id: 'bigtable',
      name: 'Cloud Bigtable',
      type: 'NoSQL (Wide-column)',
      managed: 'Managed Nodes',
      scaling: 'Horizontal Nodes',
      tags: ['nosql', 'managed', 'real-time', 'batch', 'paas'],
      pde_snippet: 'HBase compatible. Sub-10ms latency. No joins. Hotspotting is the enemy—avoid sequential row keys. NOT for small data (<300GB).',
      best_for: 'IoT, Financial tickers, Ad-tech, time-series.',
      url: 'https://cloud.google.com/bigtable/docs',
      details: {
        cost: 'Hourly per node + Storage (SSD/HDD). Data Boost for serverless processing.',
        coding: 'Heavy-code: HBase API, Client Libraries. No native SQL.',
        availability: 'Up to 99.999% with multi-cluster routing. Eventual consistency by default.',
        iam: 'roles/bigtable.user (Data access), roles/bigtable.admin (Instance management).',
        os_equiv: 'Apache HBase, Cassandra.',
        trouble: 'Hotspotting: Check Key Visualizer for high CPU on single nodes; use salting.'
      }
    },
    {
      id: 'spanner',
      name: 'Cloud Spanner',
      type: 'Relational (NewSQL)',
      managed: 'Managed Instances',
      scaling: 'Global Horizontal',
      tags: ['sql', 'managed', 'real-time', 'batch', 'paas'],
      pde_snippet: '99.999% SLA. Global ACID. External consistency. Use Interleaving to physically co-locate child tables. High cost, high consistency.',
      best_for: 'Global banking, supply chain, massive SQL workloads.',
      url: 'https://cloud.google.com/spanner/docs',
      details: {
        cost: 'Nodes/Processing Units + Storage. Higher baseline cost than Cloud SQL.',
        coding: 'Low-code (SQL). Standard SQL or PostgreSQL-compatible interface.',
        availability: '99.999% (Global/Multi-region). Strongest consistency.',
        iam: 'roles/spanner.databaseUser, roles/spanner.viewer.',
        os_equiv: 'CockroachDB, TiDB.',
        trouble: 'High Latency: Check for large transactions or missing secondary indexes.'
      }
    },
    {
      id: 'cloud-sql',
      name: 'Cloud SQL',
      type: 'Relational (OLTP)',
      managed: 'Fully Managed',
      scaling: 'Vertical (up to 64TB)',
      tags: ['sql', 'managed', 'paas', 'batch'],
      pde_snippet: 'MySQL, Postgres, SQL Server. Managed backups, HA, and read replicas. Limited horizontal write scale compared to Spanner.',
      best_for: 'Web backends, CMS, traditional ERP/CRM.',
      url: 'https://cloud.google.com/sql/docs',
      details: {
        cost: 'Instance size + Storage + Egress + Backups.',
        coding: 'Low-code (SQL).',
        availability: '99.95% (HA config required).',
        iam: 'roles/cloudsql.client, roles/cloudsql.editor.',
        os_equiv: 'Amazon RDS, Managed Databases.',
        trouble: 'Storage Full: Enable automatic storage increase. Use Cloud SQL Auth Proxy.'
      }
    },
    {
      id: 'alloydb',
      name: 'AlloyDB',
      type: 'Postgres (High-Perf)',
      managed: 'Fully Managed',
      scaling: 'Auto-scaling Read',
      tags: ['sql', 'managed', 'batch', 'paas'],
      pde_snippet: 'GCP-native Postgres with decoupled storage. 100x faster reads than standard Postgres. Columnar engine for HTAP.',
      best_for: 'High-performance PostgreSQL applications.',
      url: 'https://cloud.google.com/alloydb/docs',
      details: {
        cost: 'Compute + Storage + Data cache.',
        coding: 'Standard Postgres SQL.',
        availability: '99.99% uptime including maintenance.',
        iam: 'roles/alloydb.client, roles/alloydb.admin.',
        os_equiv: 'Amazon Aurora (Postgres).',
        trouble: 'Cache Misses: Ensure workload fits within allocated memory.'
      }
    },
    {
      id: 'firestore',
      name: 'Firestore',
      type: 'NoSQL Document',
      managed: 'Serverless',
      scaling: 'Automatic',
      tags: ['nosql', 'serverless', 'no-ops', 'real-time'],
      pde_snippet: 'Strong consistency. Real-time sync for mobile. Successor to Datastore. Scales to millions of users.',
      best_for: 'Mobile backends, user profiles, live catalogs.',
      url: 'https://cloud.google.com/firestore/docs',
      details: {
        cost: 'Read/Write/Delete operations + Storage.',
        coding: 'Low-code (Client SDKs).',
        availability: '99.99% (Regional), 99.999% (Multi-region).',
        iam: 'roles/datastore.user, roles/datastore.viewer.',
        os_equiv: 'MongoDB, CouchDB.',
        trouble: 'Index errors: Complex queries require manual composite indexes.'
      }
    },
    {
      id: 'memorystore',
      name: 'Memorystore',
      type: 'In-Memory (Redis)',
      managed: 'Fully Managed',
      scaling: 'Horizontal (Redis)',
      tags: ['nosql', 'managed', 'real-time', 'paas'],
      pde_snippet: 'Redis and Memcached. Sub-millisecond latency. Ephemeral—use for caching, not as primary DB without persistence.',
      best_for: 'Session stores, leaderboards, app caching.',
      url: 'https://cloud.google.com/memorystore/docs',
      details: {
        cost: 'Hourly per instance size.',
        coding: 'Heavy-code (Redis Client Libraries).',
        availability: '99.9% (Standard tier HA).',
        iam: 'roles/redis.editor, roles/redis.viewer.',
        os_equiv: 'Redis, Memcached.',
        trouble: 'Eviction: Check Maxmemory policy if data is disappearing too fast.'
      }
    }
  ],
  processing: [
    {
      id: 'dataflow',
      name: 'Dataflow',
      type: 'Processing',
      managed: 'Serverless',
      scaling: 'Horizontal Autoscaling',
      tags: ['serverless', 'managed', 'no-ops', 'real-time', 'batch', 'paas'],
      pde_snippet: 'Apache Beam. Unified processing. Exactly-once. Handles Late Data using Watermarks, Windowing (Fixed, Sliding, Session), and Triggers.',
      best_for: 'Real-time ETL, complex windowing, streaming analytics.',
      url: 'https://cloud.google.com/dataflow/docs',
      details: {
        cost: 'vCPU + Memory + Data Processed. Shuffle/Streaming engine adds efficiency but costs.',
        coding: 'Heavy-code (Beam Java/Python). No-code (Templates).',
        availability: 'Fault-tolerant via checkpointing.',
        iam: 'roles/dataflow.worker (VMs), roles/dataflow.developer (Jobs).',
        os_equiv: 'Apache Flink, Spark Streaming.',
        trouble: 'Hot Keys: Data skew on one key causes lag. Use Combine.perKey.'
      }
    },
    {
      id: 'dataproc',
      name: 'Dataproc',
      type: 'Managed Hadoop',
      managed: 'Managed Clusters',
      scaling: 'Preemptible Workers',
      tags: ['managed', 'paas', 'real-time', 'batch'],
      pde_snippet: 'Migrate on-prem Hadoop/Spark. Use Ephemeral clusters to save costs. Preemptible/Spot VMs for workers save ~80% cost. Dataproc Serverless avail.',
      best_for: 'Legacy Spark/Hadoop, batch Spark processing.',
      url: 'https://cloud.google.com/dataproc/docs',
      details: {
        cost: '$0.01 per vCPU/hr fee + GCE costs. Use Spot VMs for savings.',
        coding: 'Heavy-code (PySpark, Scala, Spark SQL).',
        availability: 'Multi-master for High Availability (HA).',
        iam: 'roles/dataproc.editor, roles/dataproc.worker.',
        os_equiv: 'Apache Spark, Hadoop, Hive, Presto.',
        trouble: 'YARN Memory: Too many parallel tasks for executor size. Increase memory.'
      }
    },
    {
      id: 'datafusion',
      name: 'Data Fusion',
      type: 'Visual ETL',
      managed: 'Fully Managed',
      scaling: 'Instance-based',
      tags: ['managed', 'paas', 'batch'],
      pde_snippet: 'Based on CDAP. Drag-and-drop pipeline builder. High cost but low code. Best for legacy enterprise integration patterns.',
      best_for: 'Visual pipeline design, enterprise ETL.',
      url: 'https://cloud.google.com/data-fusion/docs',
      details: {
        cost: 'Monthly instance fee + Dataflow execution costs.',
        coding: 'No-code (Visual Designer).',
        availability: 'Managed environment.',
        iam: 'roles/datafusion.admin, roles/datafusion.viewer.',
        os_equiv: 'Informatica, Talend.',
        trouble: 'Execution Latency: Check underlying Dataflow logs for performance bottlenecks.'
      }
    },
    {
      id: 'dataprep',
      name: 'Dataprep',
      type: 'Visual Cleaning',
      managed: 'Serverless',
      scaling: 'Automatic',
      tags: ['serverless', 'managed', 'no-ops', 'saas', 'batch'],
      pde_snippet: 'Trifacta-based. Visual tool for cleaning data. Generates Dataflow code under the hood. Perfect for analysts to explore datasets.',
      best_for: 'Visual data cleaning, exploratory data analysis.',
      url: 'https://cloud.google.com/dataprep/docs',
      details: {
        cost: 'Dataflow costs + Dataprep processing fee.',
        coding: 'No-code (Visual interface).',
        availability: 'SaaS availability.',
        iam: 'roles/dataprep.user, roles/dataprep.admin.',
        os_equiv: 'Trifacta, Alteryx.',
        trouble: 'Sampling limits: Large files may be sampled for display; full runs happen on Dataflow.'
      }
    },
    {
      id: 'datastream',
      name: 'Datastream',
      type: 'Ingestion (CDC)',
      managed: 'Serverless',
      scaling: 'Automatic',
      tags: ['serverless', 'managed', 'no-ops', 'real-time'],
      pde_snippet: 'Serverless Change Data Capture (CDC). Replicates Oracle/MySQL/Postgres to BigQuery or GCS in real-time with minimal latency.',
      best_for: 'Real-time database replication, stream ingestion.',
      url: 'https://cloud.google.com/datastream/docs',
      details: {
        cost: 'Data processed (per GB).',
        coding: 'No-code (Configuration based).',
        availability: 'Managed scalability.',
        iam: 'roles/datastream.admin, roles/datastream.viewer.',
        os_equiv: 'AWS DMS, Debezium.',
        trouble: 'Permission errors: Source DB needs log-level access for CDC.'
      }
    },
    {
      id: 'dataform',
      name: 'Dataform',
      type: 'SQL Modeling',
      managed: 'Serverless',
      scaling: 'BigQuery Native',
      tags: ['sql', 'serverless', 'no-ops', 'saas', 'batch'],
      pde_snippet: 'SQL-based modeling in BigQuery. Version control for SQL. Builds table dependencies and documentation. Successor to manual views.',
      best_for: 'ELT workflows inside BigQuery.',
      url: 'https://cloud.google.com/dataform/docs',
      details: {
        cost: 'Included; pay for BigQuery execution.',
        coding: 'Low-code (SQLX).',
        availability: 'BigQuery dependency.',
        iam: 'roles/dataform.editor, roles/dataform.viewer.',
        os_equiv: 'dbt (Data Build Tool).',
        trouble: 'Compilation errors: Check SQLX syntax in the IDE.'
      }
    }
  ],
  orchestration: [
    {
      id: 'pubsub',
      name: 'Pub/Sub',
      type: 'Messaging',
      managed: 'Serverless',
      scaling: 'Global Auto',
      tags: ['serverless', 'managed', 'no-ops', 'real-time'],
      pde_snippet: 'Global asynchronous messaging. Decouples publishers/subscribers. At-least-once delivery guaranteed. Exactly-once with Dataflow.',
      best_for: 'Ingestion nervous system, decoupling services.',
      url: 'https://cloud.google.com/pubsub/docs',
      details: {
        cost: 'Throughput volume. Snapshots/retention cost extra.',
        coding: 'Heavy-code (SDKs/REST). Low-code (Push subs).',
        availability: '99.95%+ Global.',
        iam: 'roles/pubsub.publisher, roles/pubsub.subscriber.',
        os_equiv: 'Apache Kafka, RabbitMQ.',
        trouble: 'DEADLINE_EXCEEDED: Subscriber not acking fast enough; increase ackDeadline.'
      }
    },
    {
      id: 'kafka',
      name: 'Managed Kafka',
      type: 'Messaging',
      managed: 'Fully Managed',
      scaling: 'Horizontal Nodes',
      tags: ['managed', 'paas', 'real-time'],
      pde_snippet: 'Apache Kafka compatible service. Best for teams migrating existing Kafka workloads without rewriting code for Pub/Sub.',
      best_for: 'Kafka migration, high-throughput ordered streams.',
      url: 'https://cloud.google.com/managed-service-for-apache-kafka/docs',
      details: {
        cost: 'Node-based hourly charges + Storage.',
        coding: 'Heavy-code (Kafka APIs).',
        availability: 'Regional/Multi-zonal.',
        iam: 'roles/managedkafka.admin, roles/managedkafka.client.',
        os_equiv: 'Confluent Cloud, Amazon MSK.',
        trouble: 'Consumer Lag: Check if number of consumers matches partition count.'
      }
    },
    {
      id: 'composer',
      name: 'Composer',
      type: 'Orchestration',
      managed: 'Managed Airflow',
      scaling: 'GKE Based',
      tags: ['managed', 'paas', 'batch'],
      pde_snippet: 'Managed Apache Airflow. Define pipelines as DAGs in Python. "The Conductor" for BQ, Dataflow, and Dataproc. Complex logic.',
      best_for: 'Complex multi-step pipelines with dependencies.',
      url: 'https://cloud.google.com/composer/docs',
      details: {
        cost: 'GKE nodes + SQL + Storage overhead.',
        coding: 'Heavy-code (Python DAGs).',
        availability: 'Environment-level SLA.',
        iam: 'roles/composer.admin, roles/composer.worker.',
        os_equiv: 'Apache Airflow.',
        trouble: 'DAG Import Errors: Check Airflow UI for Python syntax/module errors.'
      }
    },
    {
      id: 'workflows',
      name: 'Workflows',
      type: 'Orchestration',
      managed: 'Serverless',
      scaling: 'Automatic',
      tags: ['serverless', 'managed', 'no-ops', 'real-time'],
      pde_snippet: 'YAML-based orchestration. Lightweight, event-driven. Best for connecting Cloud Functions and APIs with low latency and state.',
      best_for: 'Lightweight service-to-service orchestration.',
      url: 'https://cloud.google.com/workflows/docs',
      details: {
        cost: 'Steps executed (pay per use).',
        coding: 'Low-code (YAML/JSON).',
        availability: 'Serverless scaling.',
        iam: 'roles/workflows.editor, roles/workflows.invoker.',
        os_equiv: 'AWS Step Functions.',
        trouble: 'Expression errors: Check variable mapping in the YAML steps.'
      }
    }
  ],
  ml_ai: [
    {
      id: 'vertex-ai',
      name: 'Vertex AI',
      type: 'ML Platform',
      managed: 'Unified Platform',
      scaling: 'Scalable Compute',
      tags: ['managed', 'paas', 'batch'],
      pde_snippet: 'Unified platform for Pipelines, Feature Store, Model Registry. Supports AutoML (No-code) and Custom training (Heavy-code). GenAI Studio avail.',
      best_for: 'End-to-end ML lifecycle management, GenAI apps.',
      url: 'https://cloud.google.com/vertex-ai/docs',
      details: {
        cost: 'Compute units + Model storage + API requests.',
        coding: 'Heavy-code (SDK). No-code (AutoML UI).',
        availability: 'Global/Regional services.',
        iam: 'roles/aiplatform.user, roles/aiplatform.admin.',
        os_equiv: 'Amazon SageMaker.',
        trouble: 'Pipeline Failures: Check individual component logs in the Vertex UI.'
      }
    },
    {
      id: 'bqml',
      name: 'BigQuery ML',
      type: 'SQL-based ML',
      managed: 'Serverless',
      scaling: 'BigQuery Native',
      tags: ['sql', 'serverless', 'no-ops', 'saas', 'batch'],
      pde_snippet: 'Train models (Linear/Log Reg, XGBoost, K-means) directly using SQL. No data movement required. Lowers bar for analysts.',
      best_for: 'Rapid prototyping, SQL-only ML.',
      url: 'https://cloud.google.com/bigquery/docs/bqml-introduction',
      details: {
        cost: 'BQ query cost (some models have premium rates).',
        coding: 'Low-code (SQL).',
        availability: 'BigQuery SLA.',
        iam: 'Requires BQ jobUser + dataViewer.',
        os_equiv: 'Spark MLlib.',
        trouble: 'Model convergence: Check evaluation metrics for poor fit.'
      }
    },
    {
      id: 'pretrained-api',
      name: 'Pre-trained APIs',
      type: 'AI Services',
      managed: 'Serverless API',
      scaling: 'Automatic',
      tags: ['serverless', 'managed', 'no-ops'],
      pde_snippet: 'Vision (Image), Natural Language (Sentiment), Speech-to-Text, Translation. No ML expertise needed—just REST API calls.',
      best_for: 'Standard AI tasks without custom data.',
      url: 'https://cloud.google.com/products/ai',
      details: {
        cost: 'Per API request (e.g., $/1000 images).',
        coding: 'Low-code (REST calls).',
        availability: 'Global API.',
        iam: 'roles/serviceUsage.serviceUsageConsumer.',
        os_equiv: 'AWS Rekognition, Azure Cognitive Services.',
        trouble: 'Quota limit: Check Service Quotas if requests are failing.'
      }
    }
  ],
  governance: [
    {
      id: 'dataplex',
      name: 'Dataplex',
      type: 'Data Mesh',
      managed: 'Fully Managed',
      scaling: 'Global Metadata',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Data Mesh conductor. Manage data across silos. Data Quality (DQ) checks, discovery, and unified security policies. Data Catalog built-in.',
      best_for: 'Enterprise Data Mesh, compliance monitoring.',
      url: 'https://cloud.google.com/dataplex/docs',
      details: {
        cost: 'Discovery scanning + Processing units.',
        coding: 'Low-code (Config).',
        availability: 'Managed environment.',
        iam: 'roles/dataplex.admin, roles/dataplex.viewer.',
        os_equiv: 'Informatica, Collibra.',
        trouble: 'Metadata staleness: Discovery scan frequency may be too low.'
      }
    },
    {
      id: 'dlp',
      name: 'Cloud DLP',
      type: 'Data Privacy',
      managed: 'Serverless API',
      scaling: 'On-demand',
      tags: ['serverless', 'managed', 'no-ops'],
      pde_snippet: 'Redact PII (Credit cards, SSNs). Built-in infoTypes. k-anonymity/l-diversity for de-identification. Mandatory for security questions.',
      best_for: 'PII masking, sensitive data discovery.',
      url: 'https://cloud.google.com/dlp/docs',
      details: {
        cost: 'Data scanned/transformed (per GB).',
        coding: 'Low-code (API/BQ integration).',
        availability: 'Global API.',
        iam: 'roles/dlp.user, roles/dlp.admin.',
        os_equiv: 'Protegrity.',
        trouble: 'False positives: Tune likelihood settings (e.g., LIKELY vs POSSIBLY).'
      }
    },
    {
      id: 'iam',
      name: 'IAM',
      type: 'Security',
      managed: 'Global',
      scaling: 'N/A',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Principle of Least Privilege. Service Accounts for apps. Predefined vs Custom roles. Separation of Duties.',
      best_for: 'Access control and resource security.',
      url: 'https://cloud.google.com/iam/docs',
      details: {
        cost: 'Free service.',
        coding: 'No-code (Config).',
        availability: 'Global High Availability.',
        iam: 'roles/resourcemanager.organizationAdmin.',
        os_equiv: 'AWS IAM, Azure AD.',
        trouble: 'Inheritance: Lower level permissions can be overridden by higher level ones.'
      }
    },
    {
      id: 'kms',
      name: 'Cloud KMS/HSM',
      type: 'Security',
      managed: 'Fully Managed',
      scaling: 'N/A',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'CMEK (Customer Managed) vs CSEK (Customer Supplied). Cloud HSM for hardware security. Envelope encryption.',
      best_for: 'Encryption key management.',
      url: 'https://cloud.google.com/kms/docs',
      details: {
        cost: 'Per active key version + cryptographic operations.',
        coding: 'Heavy-code (for envelope encryption).',
        availability: 'Global/Regional.',
        iam: 'roles/cloudkms.cryptoKeyEncrypterDecrypter.',
        os_equiv: 'AWS KMS.',
        trouble: 'Key Rotation: Ensure app uses current key version for encryption.'
      }
    },
    {
      id: 'secret-manager',
      name: 'Secret Manager',
      type: 'Security',
      managed: 'Fully Managed',
      scaling: 'Global',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Store sensitive data like API keys, passwords, and certificates. Versioned secrets with fine-grained IAM controls.',
      best_for: 'Storing database credentials, API keys.',
      url: 'https://cloud.google.com/secret-manager/docs',
      details: {
        cost: 'Per active secret version + access requests.',
        coding: 'Low-code (API/Client Libraries).',
        availability: 'Global/Regional.',
        iam: 'roles/secretmanager.secretAccessor, roles/secretmanager.admin.',
        os_equiv: 'AWS Secrets Manager, HashiCorp Vault.',
        trouble: 'Version Mismatch: App trying to access a deleted secret version.'
      }
    },
    {
      id: 'vpc-sc',
      name: 'VPC-SC',
      type: 'Network Security',
      managed: 'Fully Managed',
      scaling: 'N/A',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Security perimeters around resources to prevent data exfiltration. Mitigates insider threats and compromised credentials.',
      best_for: 'High-security data perimeters.',
      url: 'https://cloud.google.com/vpc-service-controls/docs',
      details: {
        cost: 'Free; requires VPC Service Controls setup.',
        coding: 'No-code (Networking Config).',
        availability: 'Global.',
        iam: 'roles/accesscontextmanager.policyAdmin.',
        os_equiv: 'Azure Private Link (partially).',
        trouble: 'Egress violations: Misconfigured perimeters block valid cross-project data movement.'
      }
    }
  ],
  operations: [
    {
      id: 'monitoring',
      name: 'Monitoring',
      type: 'Ops',
      managed: 'Fully Managed',
      scaling: 'Automatic',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Stackdriver successor. Dashboards, Alerting, SLO/SLI tracking. Integrated with all data services.',
      best_for: 'System health monitoring, uptime checks.',
      url: 'https://cloud.google.com/monitoring/docs',
      details: {
        cost: 'Volume of metrics stored.',
        coding: 'No-code (Config/UI).',
        availability: 'Global.',
        iam: 'roles/monitoring.viewer, roles/monitoring.editor.',
        os_equiv: 'Prometheus, Datadog.',
        trouble: 'Metric Lag: Some metrics are delayed depending on the source service.'
      }
    },
    {
      id: 'logging',
      name: 'Logging',
      type: 'Ops',
      managed: 'Fully Managed',
      scaling: 'Automatic',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Centralized log storage. Sink logs to BigQuery for long-term analytical audit. Query logs for debugging pipelines.',
      best_for: 'Audit trails, debugging data flows.',
      url: 'https://cloud.google.com/logging/docs',
      details: {
        cost: 'Ingestion volume. First 50GB/project is usually free.',
        coding: 'Low-code (Query language).',
        availability: 'Global.',
        iam: 'roles/logging.viewer, roles/logging.admin.',
        os_equiv: 'ELK Stack, Splunk.',
        trouble: 'Log volume: Filter logs at source to avoid high ingestion costs.'
      }
    },
    {
      id: 'trace-debugger',
      name: 'Trace & Debug',
      type: 'Ops',
      managed: 'Fully Managed',
      scaling: 'Automatic',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Cloud Trace for finding bottlenecks in distributed apps. Cloud Debugger for inspecting code state in production without stopping app.',
      best_for: 'Latency analysis, production debugging.',
      url: 'https://cloud.google.com/trace/docs',
      details: {
        cost: 'Span volume (Trace) / User interaction (Debugger).',
        coding: 'Low-code (Instrumentation required).',
        availability: 'Global.',
        iam: 'roles/cloudtrace.user, roles/clouddebugger.user.',
        os_equiv: 'Jaeger, Zipkin.',
        trouble: 'Missing Spans: Ensure application is correctly instrumented for Tracing.'
      }
    },
    {
      id: 'cloud-build',
      name: 'Cloud Build',
      type: 'Infrastructure',
      managed: 'Serverless',
      scaling: 'Automatic',
      tags: ['serverless', 'managed', 'no-ops'],
      pde_snippet: 'CI/CD for data. Automate deployment of Dataflow templates or Dataproc jobs. Pipeline as code.',
      best_for: 'Data DevOps, automation.',
      url: 'https://cloud.google.com/build/docs',
      details: {
        cost: 'Build-minute basis.',
        coding: 'Low-code (YAML/JSON config).',
        availability: 'Regional/Global.',
        iam: 'roles/cloudbuild.builds.editor.',
        os_equiv: 'Jenkins, GitHub Actions.',
        trouble: 'Timeout: Increase build timeout for large Docker image builds.'
      }
    }
  ],
  infrastructure: [
    {
      id: 'cloud-functions',
      name: 'Cloud Functions',
      type: 'Serverless Code',
      managed: 'Serverless',
      scaling: 'Auto-scaling',
      tags: ['serverless', 'managed', 'no-ops', 'real-time'],
      pde_snippet: 'Event-driven. Triggered by GCS file uploads or Pub/Sub. Best for lightweight ETL triggers and micro-processing.',
      best_for: 'Pipeline triggering, micro-ETL.',
      url: 'https://cloud.google.com/functions/docs',
      details: {
        cost: 'Memory/CPU allocation per second + requests.',
        coding: 'Heavy-code (Node, Python, Go, etc.).',
        availability: 'Automatic scaling.',
        iam: 'roles/cloudfunctions.invoker.',
        os_equiv: 'AWS Lambda.',
        trouble: 'Cold Start: First request after idle might have latency.'
      }
    },
    {
      id: 'cloud-run',
      name: 'Cloud Run',
      type: 'Serverless Containers',
      managed: 'Serverless',
      scaling: 'Auto-scaling',
      tags: ['serverless', 'managed', 'no-ops', 'batch'],
      pde_snippet: 'Run containers serverless. Scale to zero. Better than Functions for heavy processing with specific dependencies.',
      best_for: 'Containerized processing, serverless APIs.',
      url: 'https://cloud.google.com/run/docs',
      details: {
        cost: 'vCPU/Memory per second + requests.',
        coding: 'Heavy-code (Docker + Language of choice).',
        availability: 'Multi-regional HA.',
        iam: 'roles/run.invoker, roles/run.admin.',
        os_equiv: 'AWS Fargate.',
        trouble: 'Container crash: Check logs for OOM (Out of Memory) errors.'
      }
    },
    {
      id: 'vpc',
      name: 'VPC',
      type: 'Network',
      managed: 'Fully Managed',
      scaling: 'Global',
      tags: ['managed'],
      pde_snippet: 'Private network for resources. Subnets, Firewall rules, and Routes. Private Google Access allows private VMs to reach Google APIs.',
      best_for: 'Network isolation, private cloud connectivity.',
      url: 'https://cloud.google.com/vpc/docs',
      details: {
        cost: 'Egress traffic + static IPs + Peering.',
        coding: 'No-code (Config).',
        availability: 'Global network fabric.',
        iam: 'roles/compute.networkAdmin.',
        os_equiv: 'AWS VPC, Azure VNet.',
        trouble: 'Connection Denied: Check Firewall rules and Routes.'
      }
    },
    {
      id: 'interconnect-vpn',
      name: 'Conn & VPN',
      type: 'Connectivity',
      managed: 'Managed',
      scaling: 'High Bandwidth',
      tags: ['managed'],
      pde_snippet: 'Cloud VPN for encrypted site-to-site over internet. Cloud Interconnect for physical private wire (10G/100G). Essential for heavy on-prem ingestion.',
      best_for: 'Hybrid cloud connectivity.',
      url: 'https://cloud.google.com/network-connectivity/docs',
      details: {
        cost: 'VPN gateway per hour + Tunnel traffic. Interconnect is port charge + egress.',
        coding: 'No-code (Networking).',
        availability: 'Up to 99.99% for Dedicated Interconnect.',
        iam: 'roles/compute.networkAdmin.',
        os_equiv: 'AWS Direct Connect, Azure ExpressRoute.',
        trouble: 'BGP Down: Check on-prem router config and BGP peer status.'
      }
    },
    {
      id: 'cloud-nat',
      name: 'Cloud NAT',
      type: 'Infrastructure',
      managed: 'Fully Managed',
      scaling: 'Automatic',
      tags: ['managed', 'no-ops'],
      pde_snippet: 'Allow private instances (Dataproc/GCE) to access internet for updates/SaaS without public IPs. Enhanced security.',
      best_for: 'Private network internet access.',
      url: 'https://cloud.google.com/nat/docs',
      details: {
        cost: 'Gateway fee + Throughput.',
        coding: 'No-code (Networking).',
        availability: 'Highly available per region.',
        iam: 'roles/compute.networkAdmin.',
        os_equiv: 'AWS NAT Gateway.',
        trouble: 'IP Exhaustion: Ensure the IP pool is large enough for concurrent connections.'
      }
    }
  ],
  cases: [
    {
      id: 'revolut',
      company: 'Revolut',
      industry: 'Fintech',
      title: 'Petabyte-scale Fintech Data Platform',
      architecture: 'Transactions → Pub/Sub → Dataproc (Spark) → Cloud Storage → Looker',
      pde_takeaway: 'Dataproc (Spark) for large-scale batch + Pub/Sub for real-time decoupling in fintech',
      outcome: 'Revolut (65M+ customers, 1B+ monthly transactions) uses Pub/Sub to decouple real-time transaction ingestion, Dataproc for Spark-based batch analytics, and Looker for business intelligence. This architecture handles petabyte-scale financial data while maintaining compliance and performance.',
      ref: 'https://cloud.google.com/customers/revolut-data'
    },
    {
      id: 'etsy',
      company: 'Etsy',
      industry: 'E-commerce',
      title: 'ML-Powered Search & Recommendations at Scale',
      architecture: 'GCS/Dataproc → BigQuery → Dataflow → Vertex AI → Cloud Run',
      pde_takeaway: 'Dataflow as the unified batch/stream bridge into Vertex AI feature pipelines',
      outcome: 'Etsy (96M buyers, 9M sellers, $13B+ GMV) uses Dataflow for unified batch and streaming ETL into BigQuery, with Vertex AI powering personalized search and recommendations. Cloud Run serves model predictions at low latency.',
      ref: 'https://cloud.google.com/customers/etsy-ai'
    },
    {
      id: 'sanitas',
      company: 'Sanitas',
      industry: 'Healthcare',
      title: 'Real-time CDC & Data Mesh for Health Insurance',
      architecture: 'Operational DBs → Datastream (CDC) → BigQuery → Dataplex → Vertex AI',
      pde_takeaway: 'Datastream for serverless CDC replication + Dataplex for Data Mesh governance',
      outcome: 'Sanitas (850K+ customers, Swiss health insurer) uses Datastream for real-time Change Data Capture from operational systems into BigQuery. Dataplex enforces unified data quality and governance policies across all data domains, with Vertex AI (Gemini) powering intelligent claims analysis.',
      ref: 'https://cloud.google.com/customers/sanitas-ai'
    },
    {
      id: 'natwest',
      company: 'NatWest Markets',
      industry: 'Banking',
      title: 'Financial Data Mesh with Dataplex',
      architecture: 'Legacy Data Silos → BigQuery → Dataplex → Data Catalog',
      pde_takeaway: 'Dataplex for unified discovery, lineage, and policy enforcement across BQ datasets',
      outcome: 'NatWest Markets uses Dataplex to govern structured and unstructured financial data across BigQuery. Dataplex automates data discovery, enforces access policies, and tracks data lineage — enabling a Data Mesh model for debt financing and trading analytics.',
      ref: 'https://cloud.google.com/customers/natwest-markets-dataplex'
    },
    {
      id: 'llbean',
      company: 'L.L.Bean',
      industry: 'Retail',
      title: 'Global Ecommerce on Cloud Spanner',
      architecture: 'Ecommerce Events → Cloud Spanner → GKE → Persistent Disk',
      pde_takeaway: 'Cloud Spanner for globally consistent, horizontally scalable relational OLTP',
      outcome: 'L.L.Bean migrated its online retail platform to Cloud Spanner to achieve global ACID consistency and horizontal scale. This eliminated the vertical scaling ceiling of traditional RDBMS during peak holiday traffic.',
      ref: 'https://cloud.google.com/customers/l-l-bean'
    },
    {
      id: 'audiomob',
      company: 'Audiomob',
      industry: 'Ad Tech',
      title: 'Real-time Ad Serving with Bigtable',
      architecture: 'Ad Events → GKE Autopilot → Bigtable → BigQuery → Vertex AI',
      pde_takeaway: 'Bigtable for sub-10ms low-latency ad serving + BigQuery for analytical reporting',
      outcome: 'Audiomob (20K+ advertisers, 15M daily users) uses Bigtable for ultra-low-latency storage of ad impression and engagement events in mobile games. GKE Autopilot provides the serverless container runtime, while BigQuery provides the analytical view for advertiser reporting.',
      ref: 'https://cloud.google.com/customers/audiomob-advertising'
    },
    {
      id: 'vidio',
      company: 'Vidio',
      industry: 'Media & Streaming',
      title: 'OTT Streaming Analytics Pipeline',
      architecture: 'User Events → Pub/Sub → Dataflow → BigQuery → Vertex AI + GKE',
      pde_takeaway: 'Pub/Sub + Dataflow streaming pipeline for real-time viewer analytics and recommendations',
      outcome: "Vidio (45M+ monthly active users, Indonesia's leading OTT platform) processes real-time viewer events via Pub/Sub and Dataflow into BigQuery. Vertex AI powers content recommendations, and GKE handles the microservices that serve live sports and drama streams.",
      ref: 'https://cloud.google.com/customers/vidio'
    },
    {
      id: 'macquarie',
      company: 'Macquarie Bank',
      industry: 'Banking',
      title: 'Modern Banking APIs with Pub/Sub & Dataflow',
      architecture: 'Core Banking → Apigee → Pub/Sub → Dataflow → BigQuery',
      pde_takeaway: 'Apigee for API gateway + Pub/Sub/Dataflow for event-driven banking data pipelines',
      outcome: 'Macquarie Bank modernized its digital banking platform using Apigee as the API gateway, Pub/Sub for event-driven messaging between microservices, and Dataflow to process banking transactions into BigQuery for regulatory reporting and analytics.',
      ref: 'https://cloud.google.com/customers/macquariebank'
    },
    {
      id: 'illinois-dhs',
      company: 'Illinois Dept. of Human Services',
      industry: 'Government',
      title: 'Government CDC Pipeline with Datastream',
      architecture: 'Legacy Cloud SQL → Datastream (CDC) → BigQuery → Pub/Sub → Looker',
      pde_takeaway: 'Datastream for CDC from Cloud SQL to BigQuery — enabling real-time government reporting',
      outcome: 'ILDHS uses Datastream for real-time Change Data Capture from Cloud SQL into BigQuery, providing near-real-time operational dashboards via Looker for human services eligibility programs. Pub/Sub enables event-driven notifications across program systems.',
      ref: 'https://cloud.google.com/customers/ildhs'
    },
    {
      id: 'apree-health',
      company: 'apree health',
      industry: 'Healthcare',
      title: 'Healthcare Data Security with VPC-SC & CMEK',
      architecture: 'EHR Data → Datastream → BigQuery → VPC-SC + CMEK + Cloud HSM + Security Cmd Center',
      pde_takeaway: 'Defense-in-depth: VPC-SC perimeters + CMEK + Cloud HSM for HIPAA-regulated data',
      outcome: 'apree health implements a defense-in-depth security architecture using VPC Service Controls to prevent data exfiltration, Customer Managed Encryption Keys (CMEK) with Cloud HSM for HIPAA compliance, and Security Command Center for threat detection across BigQuery and GKE workloads.',
      ref: 'https://cloud.google.com/customers/apree-health'
    }
  ]
};

// Icon map for tool cards
const toolIcon = (id) => {
  if (id.includes('bigquery') || id.includes('bqml')) return <BarChart3 size={20} />;
  if (id.includes('dlp')) return <Lock size={20} />;
  if (id.includes('composer')) return <Boxes size={20} />;
  if (id.includes('vertex')) return <Rocket size={20} />;
  if (id.includes('dataflow')) return <Workflow size={20} />;
  if (id.includes('logging')) return <TerminalSquare size={20} />;
  if (id.includes('monitoring')) return <ActivitySquare size={20} />;
  if (id.includes('trace')) return <Scan size={20} />;
  if (id.includes('pubsub') || id.includes('kafka')) return <Activity size={20} />;
  if (id.includes('spanner') || id.includes('sql') || id.includes('alloydb')) return <Database size={20} />;
  if (id.includes('iam') || id.includes('kms') || id.includes('secret') || id.includes('vpc')) return <ShieldCheck size={20} />;
  if (id.includes('function') || id.includes('run')) return <Zap size={20} />;
  return <Database size={20} />;
};

const categoryColorMap = {
  storage: 'blue',
  processing: 'violet',
  orchestration: 'amber',
  ml_ai: 'emerald',
  governance: 'red',
  operations: 'slate',
  infrastructure: 'orange',
};

const colorClasses = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500'  },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500'     },
  slate:   { bg: 'bg-slate-100',  text: 'text-slate-700',   border: 'border-slate-200',   dot: 'bg-slate-500'   },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-500'  },
};

const industryColorMap = {
  'Fintech': 'blue', 'Banking': 'blue',
  'Healthcare': 'emerald',
  'E-commerce': 'violet', 'Retail': 'violet',
  'Media & Streaming': 'amber',
  'Ad Tech': 'orange',
  'Government': 'slate',
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('storage');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedCard, setExpandedCard] = useState(null);

  const categories = [
    { id: 'all',            label: 'All Tools',                icon: <Layers size={18} />,         color: 'slate'   },
    { id: 'storage',        label: 'Storage & Databases',     icon: <Database size={18} />,       color: 'blue'    },
    { id: 'processing',     label: 'Processing & Integration', icon: <Workflow size={18} />,       color: 'violet'  },
    { id: 'orchestration',  label: 'Messaging & Orchestration',icon: <Activity size={18} />,       color: 'amber'   },
    { id: 'ml_ai',          label: 'ML & AI',                  icon: <Rocket size={18} />,         color: 'emerald' },
    { id: 'governance',     label: 'Governance & Security',    icon: <ShieldCheck size={18} />,    color: 'red'     },
    { id: 'operations',     label: 'Ops & Monitoring',         icon: <ActivitySquare size={18} />, color: 'slate'   },
    { id: 'infrastructure', label: 'Infrastructure',           icon: <Construction size={18} />,   color: 'orange'  },
    { id: 'cases',          label: 'Real-World Cases',         icon: <Globe size={18} />,          color: 'blue'    },
  ];

  const tagFilters = [
    { id: 'all',       label: 'All' },
    { id: 'real-time', label: 'Real-time' },
    { id: 'batch',     label: 'Batch' },
    { id: 'serverless',label: 'Serverless' },
    { id: 'sql',       label: 'SQL' },
    { id: 'nosql',     label: 'NoSQL' },
  ];

  const allTools = useMemo(() => {
    const list = [];
    Object.keys(tools).forEach(cat => {
      if (cat !== 'cases') list.push(...tools[cat]);
    });
    return list;
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === 'cases') {
      if (!searchQuery) return tools.cases;
      const q = searchQuery.toLowerCase();
      return tools.cases.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.company.toLowerCase().includes(q) ||
        i.industry.toLowerCase().includes(q) ||
        i.pde_takeaway.toLowerCase().includes(q)
      );
    }

    const isFiltered = searchQuery.trim() !== '' || activeFilter !== 'all';
    let list = (isFiltered || activeTab === 'all') ? allTools : (tools[activeTab] || []);

    if (activeFilter !== 'all') {
      list = list.filter(i => i.tags?.includes(activeFilter));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.pde_snippet.toLowerCase().includes(q) ||
        i.best_for.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, activeFilter, searchQuery, allTools]);

  const activeCategory = categories.find(c => c.id === activeTab);
  const isFiltered = searchQuery.trim() !== '' || activeFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">

      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Layers size={16} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm leading-tight block">GCP Data Engineer</span>
                <span className="text-xs text-slate-400 leading-tight block">Study Guide</span>
              </div>
            </div>

            <div className="relative flex-1 max-w-xl">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tools, services, concepts..."
                className="w-full pl-9 pr-9 py-2 text-sm bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            <a
              href="https://cloud.google.com/learn/certification/data-engineer"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 shrink-0"
            >
              Exam Info <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Title */}
        {!isFiltered && (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {activeCategory?.label}
            </h1>
            <p className="text-sm text-slate-500">
              {activeTab === 'cases'
                ? 'Real company architectures mapped to PDE exam concepts.'
                : activeTab === 'all'
                ? 'Every GCP service covered in the Professional Data Engineer exam, in one place.'
                : 'Key services, exam insights, and decision frameworks for the Professional Data Engineer certification.'}
            </p>
          </div>
        )}

        {isFiltered && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</span>
              {searchQuery && <> for <span className="font-semibold text-blue-600">"{searchQuery}"</span></>}
              {activeFilter !== 'all' && <> · filtered by <span className="font-semibold text-blue-600">{activeFilter}</span></>}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          </div>
        )}

        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {categories.map(cat => {
                const c = colorClasses[cat.color] || colorClasses.blue;
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveTab(cat.id); setActiveFilter('all'); setExpandedCard(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                      isActive
                        ? `${c.bg} ${c.text} font-semibold`
                        : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                    }`}
                  >
                    <span className={isActive ? c.text : 'text-slate-400'}>{cat.icon}</span>
                    {cat.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Mobile Tab Scroll */}
            <div className="lg:hidden mb-6 -mx-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 px-1 pb-1">
                {categories.map(cat => {
                  const c = colorClasses[cat.color] || colorClasses.blue;
                  const isActive = activeTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setActiveTab(cat.id); setActiveFilter('all'); setExpandedCard(null); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                        isActive
                          ? `${c.bg} ${c.text} ${c.border}`
                          : 'bg-white text-slate-600 border-gray-200'
                      }`}
                    >
                      {cat.icon}{cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tag Filters — tools only */}
            {activeTab !== 'cases' && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tagFilters.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      activeFilter === f.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tool List */}
            {activeTab !== 'cases' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {filteredItems.map(item => {
                  const isOpen = expandedCard === item.id;
                  const catKey = Object.keys(tools).find(k => k !== 'cases' && tools[k].some(t => t.id === item.id));
                  const c = colorClasses[categoryColorMap[catKey]] || colorClasses.blue;
                  return (
                    <div key={item.id}>
                      {/* Row */}
                      <button
                        onClick={() => setExpandedCard(isOpen ? null : item.id)}
                        className={`w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${isOpen ? 'bg-gray-50' : ''}`}
                      >
                        {/* Icon */}
                        <div className={`shrink-0 p-2 rounded-lg ${c.bg} ${c.text}`}>
                          {toolIcon(item.id)}
                        </div>

                        {/* Name + description */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-slate-900 text-sm">{item.name}</span>
                            {item.managed?.includes('Serverless') && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                <Zap size={9} /> Serverless
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{item.best_for}</p>
                        </div>

                        {/* Type badge — hidden on small screens */}
                        <span className={`hidden md:inline-block shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                          {item.type}
                        </span>

                        {/* Scaling — hidden on small screens */}
                        <span className="hidden lg:flex shrink-0 items-center gap-1 text-xs text-slate-400 w-40">
                          <Scale size={11} /> {item.scaling}
                        </span>

                        {/* Chevron */}
                        <span className="shrink-0 text-slate-400">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>

                      {/* Expanded Detail Panel */}
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left column: exam insight + details */}
                            <div className="space-y-4">
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1.5">
                                  <ShieldAlert size={13} /> Exam Insight
                                </p>
                                <p className="text-sm text-amber-900 leading-relaxed">{item.pde_snippet}</p>
                              </div>

                              <div className="space-y-3">
                                {[
                                  { icon: <DollarSign size={13} className="text-green-600 shrink-0" />, label: 'Cost Model', value: item.details?.cost },
                                  { icon: <Terminal size={13} className="text-blue-600 shrink-0" />, label: 'Coding Level', value: item.details?.coding },
                                  { icon: <Globe size={13} className="text-indigo-600 shrink-0" />, label: 'Availability / SLA', value: item.details?.availability },
                                ].map(row => (
                                  <div key={row.label} className="flex gap-3">
                                    <div className="mt-0.5">{row.icon}</div>
                                    <div>
                                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{row.label}</p>
                                      <p className="text-xs text-slate-700 leading-relaxed">{row.value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right column: IAM, open source, troubleshooting */}
                            <div className="space-y-3">
                              {[
                                { icon: <Key size={13} className="text-purple-600 shrink-0" />, label: 'Core IAM Roles', value: item.details?.iam },
                                { icon: <Boxes size={13} className="text-slate-500 shrink-0" />, label: 'Open Source Equivalent', value: item.details?.os_equiv },
                                { icon: <Wrench size={13} className="text-red-500 shrink-0" />, label: 'Common Troubleshooting', value: item.details?.trouble },
                              ].map(row => (
                                <div key={row.label} className="flex gap-3">
                                  <div className="mt-0.5">{row.icon}</div>
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{row.label}</p>
                                    <p className="text-xs text-slate-700 leading-relaxed">{row.value}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="pt-2">
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                  Official Documentation <ExternalLink size={11} />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="py-20 text-center">
                    <Search size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No tools match your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try a different term or clear the filters</p>
                  </div>
                )}
              </div>
            )}

            {/* Case Studies */}
            {activeTab === 'cases' && (
              <div className="space-y-4">
                {filteredItems.map(item => {
                  const indColor = industryColorMap[item.industry] || 'slate';
                  const c = colorClasses[indColor] || colorClasses.slate;
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
                      <div className="flex flex-wrap items-start gap-3 mb-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                          {item.industry}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{item.company}</span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base mb-3">{item.title}</h3>

                      {/* Architecture flow */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Architecture</p>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{item.architecture}</p>
                      </div>

                      {/* Exam takeaway */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                          <ShieldAlert size={11} /> PDE Takeaway
                        </p>
                        <p className="text-xs text-amber-900 font-semibold leading-relaxed">{item.pde_takeaway}</p>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.outcome}</p>

                      <a
                        href={item.ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View case study <ExternalLink size={11} />
                      </a>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div className="py-20 text-center">
                    <Search size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No cases match your search</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
