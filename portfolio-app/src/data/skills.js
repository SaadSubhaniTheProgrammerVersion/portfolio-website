// The inventory. `stat` is the little flavour text in the tooltip.
export const SKILLS = [
  {
    group: 'Backend',
    color: 'var(--pink)',
    items: [
      { name: 'Go', icon: '🐹', stat: 'DAG engines, zero data loss' },
      { name: 'NestJS', icon: '🦁', stat: 'Payment server from scratch' },
      { name: 'TypeScript', icon: '🟦', stat: 'Daily driver' },
      { name: 'GraphQL', icon: '◈', stat: 'Internal platform APIs' },
      { name: 'PostgreSQL', icon: '🐘', stat: 'Multi-tenant metadata' },
      { name: 'TypeORM / GORM', icon: '🧬', stat: 'Both sides of the ORM war' },
      { name: 'MongoDB', icon: '🍃', stat: 'MERN / MEAN era' },
      { name: 'Microservices', icon: '🧩', stat: 'Outbox pattern enjoyer' },
    ],
  },
  {
    group: 'Frontend',
    color: 'var(--teal)',
    items: [
      { name: 'React', icon: '⚛️', stat: 'ZDP UI Kit contributor' },
      { name: 'JavaScript', icon: '🟨', stat: 'Since jQuery days' },
      { name: 'HTML / CSS', icon: '🎨', stat: 'This whole site' },
      { name: 'Cypress', icon: '🌲', stat: 'UI reliability tests' },
    ],
  },
  {
    group: 'Cloud & DevOps',
    color: 'var(--sky)',
    items: [
      { name: 'Azure / AKS', icon: '☁️', stat: 'Cluster upgrades & patching' },
      { name: 'Kubernetes', icon: '☸️', stat: 'Container whisperer' },
      { name: 'Docker', icon: '🐳', stat: 'Ships it' },
      { name: 'Keycloak', icon: '🔑', stat: 'Multi-tenant IAM & impersonation' },
      { name: 'Redis', icon: '🟥', stat: 'Caching for speed' },
      { name: 'CI/CD', icon: '🔁', stat: 'Automated image pipelines' },
      { name: 'Nginx', icon: '🟩', stat: 'Top LinkedIn skill, apparently' },
    ],
  },
  {
    group: 'AI / ML',
    color: 'var(--gold)',
    items: [
      { name: 'PyTorch', icon: '🔥', stat: 'X-rAI, award winning' },
      { name: 'scikit-learn', icon: '📈', stat: 'Classic ML' },
      { name: 'OpenCV', icon: '👁️', stat: 'Computer vision' },
      { name: 'NLTK', icon: '📝', stat: 'NLP pipelines' },
      { name: 'Python', icon: '🐍', stat: 'Olivia, search engine, X-rAI' },
    ],
  },
  {
    group: 'Low level & misc',
    color: 'var(--rose)',
    items: [
      { name: 'C / C++', icon: '⚙️', stat: 'Where it started' },
      { name: 'Java', icon: '☕', stat: 'University classic' },
      { name: 'MASM Assembly', icon: '🕹️', stat: 'PONG, the hard way' },
      { name: 'Git', icon: '🌿', stat: 'Commits with feeling' },
    ],
  },
  {
    group: 'Media',
    color: 'var(--brick)',
    items: [
      { name: 'Figma', icon: '✏️', stat: 'MVP wireframes in 2 sprints' },
      { name: 'Photoshop', icon: '🖼️', stat: 'Graphic design director' },
      { name: 'Illustrator', icon: '✒️', stat: 'Vectors & posters' },
      { name: 'Premiere Pro', icon: '🎬', stat: 'Media direction' },
      { name: 'FL Studio', icon: '🎹', stat: 'Makes beats too' },
    ],
  },
]
