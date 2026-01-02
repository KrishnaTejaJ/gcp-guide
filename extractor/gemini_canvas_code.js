import React, { useState, useMemo } from 'react';
import { 
  Database, MoveRight, Workflow, Cloud, ShieldCheck, Zap, Cpu, HardDrive, 
  Search, Server, Filter, ArrowRightLeft, Settings, AlertCircle, BarChart3, 
  Maximize2, ZapOff, Scale, ShieldAlert, Network, Microscope, Rocket,
  Eye, FileText, Construction, ShieldQuestion, ActivitySquare, TerminalSquare,
  Clock, HardDriveDownload, ChevronDown, ChevronUp, DollarSign, Key, Wrench,
  Bug, LineChart, Code, Shield, KeyRound, Share2, MessageSquare, AudioLines, ScanEye
} from 'lucide-react';

const App = () => {
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('storage');
  const [expandedCard, setExpandedCard] = useState(null);

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
        id: 'mercedes-2025',
        company: 'Mercedes-Benz',
        year: 'Jan 2025',
        title: 'GenAI Supply Chain Optimization',
        architecture: 'SAP -> Datastream -> BigQuery -> Vertex AI (Gemini)',
        pde_takeaway: 'Real-time CDC (Datastream) to BigQuery for GenAI integration',
        outcome: 'Mercedes-Benz uses Datastream to ingest real-time data from SAP into BigQuery. They integrated Vertex AI (Gemini models) to predict supply chain disruptions, reducing manual oversight by 40% using live warehouse data.',
        ref: 'https://cloud.google.com/customers/mercedes-benz'
      },
      {
        id: 'equifax-2025',
        company: 'Equifax',
        year: '2025',
        title: 'Global Financial Data Mesh Governance',
        architecture: 'GCS/BQ Silos -> Dataplex -> Data Catalog -> DLP',
        pde_takeaway: 'Dataplex for Data Mesh & fine-grained PII masking (DLP)',
        outcome: 'Equifax implemented a global Data Mesh on GCP using Dataplex to govern hundreds of petabytes. They rely on Cloud DLP to automatically discover and redact PII in BigQuery tables across different regional jurisdictions.',
        ref: 'https://cloud.google.com/customers/equifax'
      },
      {
        id: 'ford-2025',
        company: 'Ford',
        year: '2025',
        title: 'Connected Vehicle Telemetry at Scale',
        architecture: 'Vehicle IoT -> Pub/Sub -> Dataflow -> Cloud Spanner -> BigQuery',
        pde_takeaway: 'Global consistency (Spanner) for operational vehicle data',
        outcome: 'Ford manages telemetry for millions of vehicles using Pub/Sub for high-throughput ingestion and Cloud Spanner for globally consistent relational state. BigQuery provides the downstream analytical layer for safety diagnostics.',
        ref: 'https://cloud.google.com/customers/ford'
      },
      {
        id: 'priceline-2024',
        company: 'Priceline',
        year: '2024',
        title: 'Real-time Generative Trip Planning',
        architecture: 'BigQuery -> Vertex AI (Gemini) -> Cloud SQL',
        pde_takeaway: 'Separation of compute/storage for high-load analytical AI',
        outcome: 'Priceline built a real-time travel concierge using Vertex AI models that query customer preferences directly from BigQuery. This 2024 architecture shows how modern PDEs must integrate LLMs into standard data flows.',
        ref: 'https://cloud.google.com/customers/priceline'
      },
      {
        id: 'carrefour-2024',
        company: 'Carrefour',
        year: '2024',
        title: 'Multi-cloud Inventory with BigQuery Omni',
        architecture: 'Regional AWS/Azure Silos -> BigQuery Omni -> Looker',
        pde_takeaway: 'BigQuery Omni for zero-egress multi-cloud analytics',
        outcome: 'Carrefour uses BigQuery Omni to analyze store data sitting in AWS/Azure without moving it. This prevents high egress costs and ensures data governance remains centralized via the Google Cloud control plane.',
        ref: 'https://cloud.google.com/customers/carrefour'
      },
      {
        id: 'uber-2024',
        company: 'Uber',
        year: '2024',
        title: 'Global Payment Ledgers with 99.999% SLA',
        architecture: 'Payment Streams -> Cloud Spanner -> BigQuery',
        pde_takeaway: 'External Consistency and Spanner Interleaving',
        outcome: 'Uber migrated global payments to Cloud Spanner to handle the massive write load of 100M+ users while maintaining strict relational ACID properties. They use Spanner Interleaving to optimize transaction speed.',
        ref: 'https://cloud.google.com/customers/uber'
      },
      {
        id: 'lush-2024',
        company: 'Lush Cosmetics',
        year: '2024',
        title: 'Ethical multi-cloud Lakehouse',
        architecture: 'APIs -> Pub/Sub -> Dataflow -> BigLake -> BigQuery',
        pde_takeaway: 'BigLake row/column-level security on GCS files',
        outcome: 'Lush implemented a "Global Ethical Lakehouse" using BigLake to enforce BigQuery-level security policies on raw Parquet files stored in GCS, ensuring cross-cloud compliance for their digital platform.',
        ref: 'https://cloud.google.com/customers/lush'
      },
      {
        id: 'spotify-drain',
        company: 'Spotify',
        year: 'Foundational',
        title: 'Safe Dataflow Updates via DRAIN',
        architecture: 'Logs -> GCS -> Dataflow -> Bigtable',
        pde_takeaway: 'Dataflow Update Job vs Drain Method',
        outcome: 'Spotify uses Dataflow for their 100M+ user radio recommendation engine. PDE Exam Context: They utilize the DRAIN feature during code updates to ensure no in-flight telemetry data is lost while workers are updated.',
        ref: 'https://cloud.google.com/customers/spotify'
      },
      {
        id: 'vodafone-2024',
        company: 'Vodafone',
        year: '2024',
        title: 'Trillion-signal Network Analytics',
        architecture: 'Signals -> Pub/Sub -> Dataflow -> BigQuery',
        pde_takeaway: 'Watermarking & Allowed Lateness handling',
        outcome: 'Vodafone processes trillions of network signals daily. They rely on Dataflow Watermarking to correctly aggregate mobile signals that arrive out-of-order due to network latency from regional mobile towers.',
        ref: 'https://cloud.google.com/customers/vodafone'
      },
      {
        id: 'deutsche-bank-2024',
        company: 'Deutsche Bank',
        year: '2024',
        title: 'Hybrid Cloud Financial Reporting',
        architecture: 'Mainframe -> Cloud Interconnect -> BigQuery -> DLP',
        pde_takeaway: 'Cloud Interconnect & PII Redaction at ingestion',
        outcome: 'Deutsche Bank uses Dedicated Interconnect (100G) for on-prem mainframe data ingestion. They use Cloud DLP during the streaming process to mask account numbers (PII) before they are stored in analytical tables.',
        ref: 'https://cloud.google.com/customers/deutsche-bank'
      }
    ]
  };

  const categories = [
    { id: 'storage', label: 'Storage & DBs', icon: <Database size={16} /> },
    { id: 'processing', label: 'Processing & Integration', icon: <Workflow size={16} /> },
    { id: 'orchestration', label: 'Orchestration & Messaging', icon: <Boxes size={16} /> },
    { id: 'ml_ai', label: 'ML & AI', icon: <Rocket size={16} /> },
    { id: 'governance', label: 'Governance & Security', icon: <ShieldCheck size={16} /> },
    { id: 'operations', label: 'Ops & Monitoring', icon: <Activity size={16} /> },
    { id: 'infrastructure', label: 'Infrastructure', icon: <Construction size={16} /> },
    { id: 'cases', label: 'Real-World Cases', icon: <Globe size={16} /> },
  ];

  const quickFilters = [
    { id: 'All', label: 'All Tools', icon: <Globe size={14} /> },
    { id: 'real-time', label: 'Real-time', icon: <Clock size={14} /> },
    { id: 'batch', label: 'Batch', icon: <HardDriveDownload size={14} /> },
    { id: 'sql', label: 'SQL (Relational)', icon: <BarChart3 size={14} /> },
    { id: 'nosql', label: 'NoSQL', icon: <Terminal size={14} /> },
    { id: 'serverless', label: 'Serverless', icon: <Zap size={14} /> },
    { id: 'managed', label: 'Fully Managed', icon: <ShieldCheck size={14} /> },
    { id: 'no-ops', label: 'No-Ops', icon: <ZapOff size={14} /> },
    { id: 'paas', label: 'PaaS', icon: <Layers size={14} /> },
    { id: 'saas', label: 'SaaS', icon: <Cloud size={14} /> },
  ];

  const allTools = useMemo(() => {
    const list = [];
    Object.keys(tools).forEach(cat => {
      if (cat !== 'cases') list.push(...tools[cat]);
    });
    return list;
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === 'cases') return tools.cases;

    const source = (searchQuery.trim() !== '' || filter !== 'All') ? allTools : tools[activeTab];
    let list = source || [];

    if (filter !== 'All') {
      const f = filter.toLowerCase();
      list = list.filter(i => i.tags?.includes(f));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.name.toLowerCase().includes(q) ||
        i.pde_snippet.toLowerCase().includes(q) ||
        i.best_for.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeTab, filter, searchQuery, allTools]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex items-center gap-3">
              <Layers className="text-blue-600" />
              PDE ULTIMATE NAVIGATOR
            </h1>
            <p className="text-slate-500 mt-1 font-bold italic uppercase tracking-wider text-xs">Exhaustive 2025 Professional Data Engineering Guide</p>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Global search across all tools..." 
              className="pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-full w-full md:w-[450px] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all shadow-lg shadow-blue-900/5 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Category Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex border-b-2 border-slate-200 gap-8 overflow-x-auto scrollbar-hide py-2">
          {categories.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 px-1 transition-all whitespace-nowrap relative group ${activeTab === tab.id ? 'text-blue-700 font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab.icon}
              <span className="text-sm uppercase tracking-tighter">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-blue-700 rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Global Filters */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all shadow-sm border ${
                filter === cat.id 
                ? 'bg-blue-700 text-white border-blue-700 shadow-blue-900/20' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
        {(searchQuery || filter !== 'All') && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">
              Showing {filteredItems.length} results found
            </span>
            <button 
              onClick={() => {setSearchQuery(''); setFilter('All');}}
              className="text-xs font-black text-blue-800 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col"
          >
            {activeTab === 'cases' ? (
              <div className="p-8 flex flex-col h-full bg-slate-900 text-white">
                 <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">{item.company}</span>
                    <span className="text-[10px] font-black text-slate-500">{item.year}</span>
                 </div>
                 <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight">{item.title}</h3>
                 
                 <div className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/10">
                    <p className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2"><Workflow size={14}/> Architecture Stack</p>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{item.architecture}</p>
                 </div>

                 <div className="bg-blue-900/40 p-4 rounded-2xl mb-6 border border-blue-500/30">
                    <p className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2"><ShieldAlert size={14}/> PDE Exam Core Context</p>
                    <p className="text-xs text-blue-100 font-bold italic">{item.pde_takeaway}</p>
                 </div>

                 <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6 flex-grow">{item.outcome}</p>
                 
                 <a href={item.ref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-white transition-all uppercase tracking-widest border border-blue-400/20 px-4 py-2 rounded-xl hover:bg-blue-400/10">
                    Original Case Study <ExternalLink size={12} />
                 </a>
              </div>
            ) : (
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-all shadow-sm">
                    {item.id.includes('bigquery') ? <BarChart3 size={28} /> : 
                     item.id.includes('dlp') ? <Lock size={28} /> : 
                     item.id.includes('composer') ? <Boxes size={28} /> : 
                     item.id.includes('vertex') ? <Rocket size={28} /> : 
                     item.id.includes('dataflow') ? <Workflow size={28} /> : 
                     item.id.includes('logging') ? <TerminalSquare size={28} /> :
                     item.id.includes('monitoring') ? <ActivitySquare size={28} /> :
                     item.id.includes('trace') ? <ScanEye size={28} /> :
                     <Database size={28} />}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                      {item.type}
                    </span>
                    {item.managed.includes('Serverless') && (
                      <span className="flex items-center gap-1 text-[9px] text-indigo-700 font-black bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest shadow-sm">
                        <Zap size={10} fill="currentColor" /> Serverless
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">{item.name}</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed font-bold italic">
                  {item.best_for}
                </p>

                <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert size={16} className="text-yellow-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PDE EXAM CRITICAL</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-bold italic">
                    "{item.pde_snippet}"
                  </p>
                </div>

                {/* Visible Technical Profile */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Management</label>
                    <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 uppercase leading-tight">
                      <ShieldCheck size={14} className="text-blue-500 shrink-0" /> {item.managed}
                    </span>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Scale Strategy</label>
                    <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 uppercase leading-tight">
                      <Scale size={14} className="text-blue-500 shrink-0" /> {item.scaling}
                    </span>
                  </div>
                </div>

                {/* Collapsible Deep Dive */}
                <div className="mt-auto pt-2">
                  <button 
                    onClick={() => setExpandedCard(expandedCard === item.id ? null : item.id)}
                    className="w-full flex items-center justify-between text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2 hover:bg-blue-50 p-2 rounded-lg transition-all"
                  >
                    Deep Dive Technical Profile
                    {expandedCard === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  
                  {expandedCard === item.id && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300 mb-4">
                      <div className="flex items-start gap-3">
                        <DollarSign size={14} className="text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Cost Model</p>
                          <p className="text-[11px] font-bold text-slate-700">{item.details?.cost}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Terminal size={14} className="text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Coding Level</p>
                          <p className="text-[11px] font-bold text-slate-700">{item.details?.coding}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Globe size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Availability / SLA</p>
                          <p className="text-[11px] font-bold text-slate-700">{item.details?.availability}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Key size={14} className="text-purple-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Core IAM Roles</p>
                          <p className="text-[11px] font-bold text-slate-700">{item.details?.iam}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Boxes size={14} className="text-slate-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Open Source Equiv.</p>
                          <p className="text-[11px] font-bold text-slate-700">{item.details?.os_equiv}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Wrench size={14} className="text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Troubleshooting</p>
                          <p className="text-[11px] font-bold text-slate-700">{item.details?.trouble}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-blue-700 hover:text-blue-900 uppercase">
                      Official Docs <ExternalLink size={12} />
                    </a>
                    <Settings size={20} className="text-slate-200 group-hover:text-blue-100 transition-colors animate-spin-slow" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <Search size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No matching tools found</h3>
            <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or search query</p>
          </div>
        )}
      </main>

      {/* Strategy Footer */}
      <footer className="max-w-7xl mx-auto mt-16 p-10 bg-white border-2 border-slate-100 rounded-[3rem] shadow-xl flex flex-col md:flex-row gap-10 items-center">
        <div className="flex-1">
          <h4 className="font-black text-slate-900 text-2xl mb-4 flex items-center gap-3 tracking-tighter">
             <Network className="text-blue-700" size={32} />
             Architectural Rule of Thumb
          </h4>
          <p className="text-sm leading-relaxed font-medium text-slate-600">
            When choosing a tool for the PDE exam: 
            (1) **Serverless First** (BigQuery, Dataflow, Cloud Run). 
            (2) **Decouple Ingestion** using Pub/Sub. 
            (3) **Consistent SQL** at scale means Spanner. 
            (4) **Cost Savings** in Dataproc usually means Preemptible VMs. 
            (5) **PII Redaction** is always Cloud DLP. 
            (6) If transfer time over network { '->' } 1 week, use **Transfer Appliance**.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-900 text-white px-8 py-6 rounded-[2rem] text-center shadow-2xl">
              <span className="block text-3xl font-black mb-1">CDC</span>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Datastream</span>
           </div>
           <div className="bg-blue-700 text-white px-8 py-6 rounded-[2rem] text-center shadow-2xl shadow-blue-700/30">
              <span className="block text-3xl font-black mb-1">SQL</span>
              <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Dataform</span>
           </div>
        </div>
      </footer>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;