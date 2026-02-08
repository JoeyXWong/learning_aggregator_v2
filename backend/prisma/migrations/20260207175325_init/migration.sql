-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_aggregated_at" DATETIME,
    "resource_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "normalized_url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT,
    "pricing" TEXT,
    "platform" TEXT,
    "duration" INTEGER,
    "rating" REAL,
    "review_count" INTEGER,
    "view_count" INTEGER,
    "publish_date" DATETIME,
    "last_updated_date" DATETIME,
    "last_verified_at" DATETIME,
    "quality_score" INTEGER,
    "thumbnail_url" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "topic_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "relevance_score" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "topic_resources_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "topic_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "learning_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topic_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preferences" TEXT NOT NULL,
    "phases" TEXT NOT NULL,
    "total_duration" INTEGER,
    "completion_percentage" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "learning_plans_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "progress_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "notes" TEXT,
    "time_spent" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "progress_entries_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "learning_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "progress_entries_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_normalized_name_idx" ON "topics"("normalized_name");

-- CreateIndex
CREATE INDEX "topics_slug_idx" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "topics_last_aggregated_at_idx" ON "topics"("last_aggregated_at");

-- CreateIndex
CREATE UNIQUE INDEX "resources_url_key" ON "resources"("url");

-- CreateIndex
CREATE INDEX "resources_url_idx" ON "resources"("url");

-- CreateIndex
CREATE INDEX "resources_normalized_url_idx" ON "resources"("normalized_url");

-- CreateIndex
CREATE INDEX "resources_type_idx" ON "resources"("type");

-- CreateIndex
CREATE INDEX "resources_difficulty_idx" ON "resources"("difficulty");

-- CreateIndex
CREATE INDEX "resources_pricing_idx" ON "resources"("pricing");

-- CreateIndex
CREATE INDEX "resources_platform_idx" ON "resources"("platform");

-- CreateIndex
CREATE INDEX "resources_quality_score_idx" ON "resources"("quality_score" DESC);

-- CreateIndex
CREATE INDEX "resources_rating_idx" ON "resources"("rating" DESC);

-- CreateIndex
CREATE INDEX "topic_resources_topic_id_idx" ON "topic_resources"("topic_id");

-- CreateIndex
CREATE INDEX "topic_resources_resource_id_idx" ON "topic_resources"("resource_id");

-- CreateIndex
CREATE INDEX "topic_resources_relevance_score_idx" ON "topic_resources"("relevance_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "topic_resources_topic_id_resource_id_key" ON "topic_resources"("topic_id", "resource_id");

-- CreateIndex
CREATE INDEX "learning_plans_topic_id_idx" ON "learning_plans"("topic_id");

-- CreateIndex
CREATE INDEX "learning_plans_created_at_idx" ON "learning_plans"("created_at" DESC);

-- CreateIndex
CREATE INDEX "progress_entries_plan_id_idx" ON "progress_entries"("plan_id");

-- CreateIndex
CREATE INDEX "progress_entries_resource_id_idx" ON "progress_entries"("resource_id");

-- CreateIndex
CREATE INDEX "progress_entries_status_idx" ON "progress_entries"("status");

-- CreateIndex
CREATE INDEX "progress_entries_completed_at_idx" ON "progress_entries"("completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "progress_entries_plan_id_resource_id_key" ON "progress_entries"("plan_id", "resource_id");
