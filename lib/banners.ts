// Banner images from /public/images/banners/
export const BANNER_IMAGES = [
  "/images/banners/1.png",
  "/images/banners/2.png",
  "/images/banners/3.png",
  "/images/banners/4.png",
  "/images/banners/5.png",
  "/images/banners/6.png",
  "/images/banners/7.png",
  "/images/banners/8.png",
  "/images/banners/9.png",
  "/images/banners/10.png",
  "/images/banners/11.png",
  "/images/banners/12.png",
  "/images/banners/13.png",
  "/images/banners/14.png",
  "/images/banners/15.png",
  "/images/banners/16.png",
  "/images/banners/17.png",
  "/images/banners/18.png",
  "/images/banners/19.png",
  "/images/banners/20.png",
  "/images/banners/21.png",
  "/images/banners/22.png",
  "/images/banners/23.png",
];

// Dynamic text variations for banners
export const BANNER_TEXTS = [
  {
    headline: "Start turning your\nideas into reality.",
    description: "Create a free account and get full access to all features for 30-days. No credit card needed. Get started in 2 minutes.",
  },
  {
    headline: "Build amazing projects\nwith your team.",
    description: "Collaborate seamlessly and bring your ideas to life. Join thousands of teams already using Zyra Spaces.",
  },
  {
    headline: "Organize everything\nin one place.",
    description: "Manage projects, tasks, and deadlines effortlessly. Experience the power of organized teamwork.",
  },
  {
    headline: "Work smarter,\nnot harder.",
    description: "Streamline your workflow and boost productivity. Everything you need to succeed is right here.",
  },
  {
    headline: "Your workspace,\nreimagined.",
    description: "A modern platform designed for modern teams. Start your journey to better project management today.",
  },
  {
    headline: "Collaborate, create,\nand conquer.",
    description: "Bring your team together and achieve more. Join the future of project management.",
  },
  {
    headline: "From concept\nto completion.",
    description: "Turn your vision into reality with tools designed for success. Start building something amazing today.",
  },
  {
    headline: "Where teams\nthrive together.",
    description: "Connect, communicate, and create. Experience the difference that great tools make.",
  },
];

// Get random banner
export function getRandomBanner(): string {
  return BANNER_IMAGES[Math.floor(Math.random() * BANNER_IMAGES.length)];
}

// Get random text
export function getRandomText() {
  return BANNER_TEXTS[Math.floor(Math.random() * BANNER_TEXTS.length)];
}

// Get random banner that's different from current
export function getDifferentBanner(currentBanner: string): string {
  const availableBanners = BANNER_IMAGES.filter(b => b !== currentBanner);
  if (availableBanners.length === 0) return getRandomBanner();
  return availableBanners[Math.floor(Math.random() * availableBanners.length)];
}

