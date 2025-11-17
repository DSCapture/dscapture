/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://ds-capture.de',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: [
    '/asdf',
    '/api/*',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: [
          '/', 
          '/about',
          '/kontakt',
          '/blog',
          '/portfolio',
        ],
        disallow: ['/asdf', '/api'],
      },
    ],
  },
};
