import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample topic
  const reactTopic = await prisma.topic.create({
    data: {
      name: 'React Hooks',
      normalizedName: 'react hooks',
      slug: 'react-hooks',
      metadata: {
        category: 'frontend',
        difficulty: 'intermediate',
      },
    },
  });

  console.log('✅ Created topic:', reactTopic.name);

  // Create sample resources
  const resources = await prisma.resource.createMany({
    data: [
      {
        title: 'React Hooks Tutorial for Beginners',
        description:
          'Learn the basics of React Hooks including useState and useEffect with practical examples.',
        url: 'https://www.youtube.com/watch?v=O6P86uwfdR0',
        normalizedUrl: 'https://youtube.com/watch?v=O6P86uwfdR0',
        type: 'video',
        difficulty: 'beginner',
        pricing: 'free',
        platform: 'youtube',
        duration: 45,
        rating: 4.8,
        reviewCount: 1200,
        viewCount: 150000,
        qualityScore: 85,
        publishDate: new Date('2023-01-15'),
        metadata: {
          author: 'Web Dev Simplified',
          language: 'en',
          tags: ['react', 'hooks', 'useState', 'useEffect'],
        },
      },
      {
        title: 'React Official Hooks Documentation',
        description: 'Official React documentation for Hooks API reference and guides.',
        url: 'https://react.dev/reference/react/hooks',
        normalizedUrl: 'https://react.dev/reference/react/hooks',
        type: 'documentation',
        difficulty: 'intermediate',
        pricing: 'free',
        platform: 'react.dev',
        duration: 120,
        qualityScore: 95,
        publishDate: new Date('2023-03-01'),
        lastUpdatedDate: new Date('2024-12-01'),
        metadata: {
          author: 'React Team',
          language: 'en',
          tags: ['react', 'hooks', 'documentation'],
        },
      },
      {
        title: 'Build a Complete React App with Hooks',
        description:
          'Comprehensive course on building production-ready React applications using modern Hooks patterns.',
        url: 'https://www.udemy.com/course/react-hooks-mastery',
        normalizedUrl: 'https://udemy.com/course/react-hooks-mastery',
        type: 'course',
        difficulty: 'advanced',
        pricing: 'premium',
        platform: 'udemy',
        duration: 600,
        rating: 4.7,
        reviewCount: 3500,
        qualityScore: 82,
        publishDate: new Date('2023-06-10'),
        metadata: {
          author: 'Maximilian Schwarzmüller',
          language: 'en',
          price: 84.99,
          tags: ['react', 'hooks', 'advanced', 'production'],
        },
      },
    ],
  });

  console.log(`✅ Created ${resources.count} resources`);

  // Link resources to topic
  const allResources = await prisma.resource.findMany({
    take: 3,
  });

  for (const resource of allResources) {
    await prisma.topicResource.create({
      data: {
        topicId: reactTopic.id,
        resourceId: resource.id,
        relevanceScore: 95.0,
      },
    });
  }

  console.log('✅ Linked resources to topic');

  // Update topic resource count
  await prisma.topic.update({
    where: { id: reactTopic.id },
    data: {
      resourceCount: resources.count,
      lastAggregatedAt: new Date(),
    },
  });

  console.log('✅ Updated topic resource count');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
