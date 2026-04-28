'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ListingCard from '@/components/listings/ListingCard'
import api from '@/lib/api'
import type { Listing, Category, PaginatedData } from '@/lib/types'
import { motion, easeOut } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import {
  Shirt,
  BookOpen,
  Palette,
  Smartphone,
  Armchair,
  Bike,
  Watch,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Shield,
  Recycle,
  Tag,
  CreditCard,
  Package,
  Search,
  Star,
  Users,
  TrendingUp,
  CheckCircle2,
  Leaf,
} from 'lucide-react'

const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || ''

const categoryIcons: Record<string, React.ReactNode> = {
  Clothes: <Shirt className="w-6 h-6" />,
  Books: <BookOpen className="w-6 h-6" />,
  Crafts: <Palette className="w-6 h-6" />,
  Electronics: <Smartphone className="w-6 h-6" />,
  Furniture: <Armchair className="w-6 h-6" />,
  Sports: <Bike className="w-6 h-6" />,
  Accessories: <Watch className="w-6 h-6" />,
  Other: <ShoppingBag className="w-6 h-6" />,
}

const defaultCategoryIcons = [
  <Shirt className="w-6 h-6" />,
  <BookOpen className="w-6 h-6" />,
  <Palette className="w-6 h-6" />,
  <Smartphone className="w-6 h-6" />,
  <Armchair className="w-6 h-6" />,
  <Bike className="w-6 h-6" />,
  <Watch className="w-6 h-6" />,
  <ShoppingBag className="w-6 h-6" />,
]

const testimonials = [
  {
    name: 'Sarah M.',
    role: 'Seller',
    content: 'I cleared out my closet and made some extra cash. The listing process was so simple!',
    rating: 5,
  },
  {
    name: 'James K.',
    role: 'Buyer',
    content: 'Found amazing vintage books at incredible prices. This platform is a treasure trove.',
    rating: 5,
  },
  {
    name: 'Emily R.',
    role: 'Seller & Buyer',
    content: 'Love the sustainable approach. Every item deserves a second chance!',
    rating: 5,
  },
]

const stats = [
  { label: 'Active Listings', value: '2,500+', icon: <Package className="w-5 h-5" /> },
  { label: 'Happy Users', value: '1,200+', icon: <Users className="w-5 h-5" /> },
  { label: 'Items Sold', value: '5,000+', icon: <TrendingUp className="w-5 h-5" /> },
  { label: 'CO2 Saved', value: '8.5T', icon: <Leaf className="w-5 h-5" /> },
]

const howItWorks = {
  buy: [
    { step: '01', title: 'Browse Listings', description: 'Explore thousands of unique pre-loved items from sellers near you.', icon: <Search className="w-6 h-6" /> },
    { step: '02', title: 'Find Your Treasure', description: 'Use filters to discover exactly what you are looking for at great prices.', icon: <Tag className="w-6 h-6" /> },
    { step: '03', title: 'Connect & Buy', description: 'Reach out to sellers and arrange a safe exchange for your new item.', icon: <ShoppingBag className="w-6 h-6" /> },
  ],
  sell: [
    { step: '01', title: 'List Your Item', description: 'Take photos, add a description, and set your price in minutes.', icon: <Package className="w-6 h-6" /> },
    { step: '02', title: 'Pay Listing Fee', description: 'A small secure fee via Stripe makes your listing visible to everyone.', icon: <CreditCard className="w-6 h-6" /> },
    { step: '03', title: 'Get Discovered', description: 'Buyers find your item and you connect to complete the sale.', icon: <TrendingUp className="w-6 h-6" /> },
  ],
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: easeOut },
}

const staggerContainer = {
  whileInView: { transition: { staggerChildren: 0.1 } },
}

function HeroSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=2000&q=80"
          alt="Thrift store items"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4" />
            Sustainable shopping made easy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Give pre-loved items a{' '}
            <span className="text-primary relative">
              new home
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C50 2 150 2 198 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed"
          >
            Buy and sell second-hand clothes, books, crafts, and more.
            Join a community that values sustainability and great deals.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            {isLoggedIn ? (
              <Link href="/search">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  <Search className="w-4 h-4 mr-2" />
                  Browse listings
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    <Search className="w-4 h-4 mr-2" />
                    Get started
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 bg-background/50 backdrop-blur-sm">
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center gap-6 mt-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              Secure payments
            </div>
            <div className="flex items-center gap-1.5">
              <Recycle className="w-4 h-4 text-primary" />
              Eco-friendly
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-primary" />
              Trusted community
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          {...fadeInUp}
          className="text-center mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Browse by category</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Find exactly what you are looking for in our curated categories
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: '-50px' }}
          className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto"
        >
          {categories.slice(0, 8).map((cat, index) => (
            <motion.div key={cat.category_id} variants={fadeInUp} className="w-[calc(50%-0.5rem)] sm:w-[calc(25%-0.75rem)]">
              <Link href={`/search?category_id=${cat.category_id}`}>
                <Card className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md">
                  <CardContent className="p-4 sm:p-5 text-center">
                    <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {categoryIcons[cat.category_name] || defaultCategoryIcons[index % defaultCategoryIcons.length]}
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base">{cat.category_name}</h3>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeaturedListings({ listings, loading }: { listings: Listing[]; loading: boolean }) {
  return (
    <section className="py-12 sm:py-16 bg-secondary/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          {...fadeInUp}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Fresh finds</h2>
            <p className="text-muted-foreground">Recently listed items waiting for a new home</p>
          </div>
          {listings.length > 6 && (
            <Link href="/search">
              <Button variant="outline">
                View all
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {listings.slice(0, 6).map((listing) => (
              <motion.div key={listing.listing_id} variants={fadeInUp}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No listings available yet. Be the first to list!</p>
            <Link href="/auth/register" className="mt-4 inline-block">
              <Button variant="outline" className="mt-4">
                Start selling
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const steps = howItWorks[activeTab]

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInUp} className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">How it works</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Simple steps to start buying or selling on ThriftStore
          </p>
        </motion.div>

        <motion.div {...fadeInUp} className="flex justify-center mb-8">
          <div className="inline-flex bg-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'buy'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buying
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'sell'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Selling
            </button>
          </div>
        </motion.div>

        <motion.div
          key={activeTab}
          variants={staggerContainer}
          initial="initial"
          animate="whileInView"
          className="grid sm:grid-cols-3 gap-6 sm:gap-8"
        >
          {steps.map((step, index) => (
            <motion.div key={step.step} variants={fadeInUp} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden sm:block absolute top-10 left-full w-full h-px bg-border -translate-x-1/2" />
              )}
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function StatsSection() {
  return (
    <section className="py-12 sm:py-16 bg-primary text-primary-foreground">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInUp} className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Growing every day</h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto">
            Join thousands of users making a difference through sustainable shopping
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-3">
                {stat.icon}
              </div>
              <div className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</div>
              <div className="text-primary-foreground/70 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Secure Payments',
      description: 'All listing fees are processed securely through Stripe. Your transactions are protected.',
    },
    {
      icon: <Recycle className="w-6 h-6" />,
      title: 'Eco-Friendly',
      description: 'Every item you buy or sell reduces waste and helps build a more sustainable future.',
    },
    {
      icon: <Tag className="w-6 h-6" />,
      title: 'Great Prices',
      description: 'Find unique items at fraction of retail prices. Perfect for budget-conscious shoppers.',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Easy Listing',
      description: 'List your items in minutes with our simple process. Just add photos, description, and price.',
    },
  ]

  return (
    <section className="py-12 sm:py-16 bg-secondary/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInUp} className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Why choose ThriftStore</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We make second-hand shopping simple, secure, and sustainable
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: '-50px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <Card className="border-border/50 hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div {...fadeInUp} className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">What our users say</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Real stories from our community of thrifters
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: '-50px' }}
          className="grid sm:grid-cols-3 gap-6"
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.name} variants={fadeInUp}>
              <Card className="border-border/50 h-full">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 text-muted-foreground">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          {...fadeInUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-8 sm:p-12 lg:p-16"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
              <CheckCircle2 className="w-4 h-4" />
              Start today
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
              Ready to declutter and earn?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              List your pre-loved items in minutes and reach thousands of potential buyers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
                  Create your account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/search">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  Browse listings
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                T
              </div>
              ThriftStore
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your marketplace for pre-loved items. Buy, sell, and give things a second chance.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Marketplace</h3>
            <ul className="space-y-2.5">
              <li><Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse listings</Link></li>
              <li><Link href="/auth/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Start selling</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Account</h3>
            <ul className="space-y-2.5">
              <li><Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link></li>
              <li><Link href="/auth/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Create account</Link></li>
              <li><Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Values</h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Recycle className="w-4 h-4 text-primary" />
                Sustainability
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Secure transactions
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                Community driven
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ThriftStore. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Made with
            <Leaf className="w-4 h-4 text-primary" />
            for a greener future
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage() {
  const { user } = useAuthStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(true)

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoadingListings(true)
    api.get('/listings', { params: { per_page: 100, sort: 'newest' } })
      .then(({ data }) => {
        const paginated: PaginatedData<Listing> = data.data
        setListings(paginated.data || [])
      })
      .catch(() => setListings([]))
      .finally(() => setLoadingListings(false))
  }, [])

  return (
    <div className="min-h-screen">
      <HeroSection isLoggedIn={!!user} />
      <CategoriesSection categories={categories} />
      <FeaturedListings listings={listings} loading={loadingListings} />
      <HowItWorksSection />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
