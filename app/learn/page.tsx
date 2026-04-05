"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  videos,
  guides,
  features,
  categories,
  type Category,
  type Video,
  type Guide,
} from "@/lib/content-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Play,
  FileText,
  Download,
  ExternalLink,
  Clock,
  Upload,
  Target,
  Lock,
  Shield,
  Mail,
  Grid,
  AlertTriangle,
  Quote,
  Trash2,
  ArrowRight,
  BookOpen,
  Video as VideoIcon,
  Sparkles,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Upload,
  Search,
  Target,
  Clock,
  FileText,
  Mail,
  Lock,
  Trash2,
  Shield,
  Grid,
  AlertTriangle,
  Quote,
};

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    pip: "bg-amber-100 text-amber-800 border-amber-200",
    employment: "bg-blue-100 text-blue-800 border-blue-200",
    parking: "bg-green-100 text-green-800 border-green-200",
    insurance: "bg-purple-100 text-purple-800 border-purple-200",
    general: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const labels: Record<string, string> = {
    pip: "PIP Appeals",
    employment: "Employment",
    parking: "Parking",
    insurance: "Insurance",
    general: "General",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colors[category] || colors.general}`}>
      {labels[category] || category}
    </span>
  );
}

function VideoCard({ video }: { video: Video }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CategoryBadge category={video.category} />
            <CardTitle className="text-base mt-2 group-hover:text-[#c9a84c] transition-colors line-clamp-2">
              {video.title}
            </CardTitle>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-white ml-0.5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{video.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {video.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {video.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              {video.source}
            </span>
          </div>
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c9a84c] text-sm font-medium hover:underline flex items-center gap-1"
          >
            Watch <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const typeIcons = {
    pdf: FileText,
    template: FileText,
    checklist: FileText,
  };
  const TypeIcon = typeIcons[guide.type];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#0f172a] flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-5 h-5 text-[#c9a84c]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={guide.category} />
              <Badge variant="outline" className="text-xs capitalize">
                {guide.type}
              </Badge>
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-[#c9a84c] transition-colors line-clamp-1">
              {guide.title}
            </h3>
            <p className="text-sm text-slate-600 line-clamp-2 mt-1">{guide.description}</p>
          </div>
          {guide.downloadable && (
            <a
              href={guide.url}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 hover:bg-[#c9a84c] hover:text-white flex items-center justify-center transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ feature }: { feature: (typeof features)[0] }) {
  const Icon = iconMap[feature.icon] || Sparkles;

  return (
    <div className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-[#c9a84c] hover:shadow-lg transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#c9a84c]" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 group-hover:text-[#c9a84c] transition-colors">
            {feature.title}
          </h3>
          <p className="text-sm text-slate-600 mt-1">{feature.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || video.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || guide.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const recommendedContent = useMemo(() => {
    // Show featured content based on selected category
    if (selectedCategory === "all") {
      return {
        videos: videos.slice(0, 3),
        guides: guides.slice(0, 2),
      };
    }
    return {
      videos: videos.filter((v) => v.category === selectedCategory).slice(0, 3),
      guides: guides.filter((g) => g.category === selectedCategory).slice(0, 2),
    };
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UJRIS%203D%20LOGO_TRANSPARENT%20BACKGROUND%202-WOnejyAsEuSSKBlOi6k8nTXsGT3mAr.jpg"
                alt="UJRIS"
                width={40}
                height={40}
                className="rounded"
              />
              <span className="font-serif font-bold text-xl text-[#0f172a]">
                UJRIS
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-slate-600 hover:text-[#0f172a] transition-colors">
                Home
              </Link>
              <Link href="/learn" className="text-[#c9a84c] font-medium">
                Resources
              </Link>
              <Link href="/#pricing" className="text-slate-600 hover:text-[#0f172a] transition-colors">
                Pricing
              </Link>
              <Button asChild className="bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a]">
                <a href="https://tally.so/r/eq2Pqe" target="_blank" rel="noopener noreferrer">
                  Start Your Case
                </a>
              </Button>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 py-4 px-4">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-slate-600 hover:text-[#0f172a] transition-colors">
                Home
              </Link>
              <Link href="/learn" className="text-[#c9a84c] font-medium">
                Resources
              </Link>
              <Link href="/#pricing" className="text-slate-600 hover:text-[#0f172a] transition-colors">
                Pricing
              </Link>
              <Button asChild className="bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a] w-full">
                <a href="https://tally.so/r/eq2Pqe" target="_blank" rel="noopener noreferrer">
                  Start Your Case
                </a>
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 mb-4">
              Free Educational Resources
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Legal Education Hub
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              35+ GOV.UK videos, downloadable guides, and templates to help you understand your rights and win your case.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search videos, guides, and templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-white text-slate-900 border-0 rounded-full shadow-lg"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? "bg-[#c9a84c] text-[#0f172a]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Section */}
      {selectedCategory !== "all" && (
        <section className="py-8 bg-gradient-to-r from-[#c9a84c]/10 to-[#c9a84c]/5 border-b border-[#c9a84c]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#c9a84c]" />
              <h2 className="font-semibold text-[#0f172a]">
                Recommended for {categories.find((c) => c.id === selectedCategory)?.label}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {recommendedContent.videos.slice(0, 2).map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
              {recommendedContent.guides.slice(0, 1).map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="w-full max-w-md mx-auto mb-8 bg-slate-100 p-1 rounded-full">
              <TabsTrigger
                value="videos"
                className="flex-1 rounded-full data-[state=active]:bg-[#0f172a] data-[state=active]:text-white"
              >
                <VideoIcon className="w-4 h-4 mr-2" />
                Videos ({filteredVideos.length})
              </TabsTrigger>
              <TabsTrigger
                value="guides"
                className="flex-1 rounded-full data-[state=active]:bg-[#0f172a] data-[state=active]:text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Guides ({filteredGuides.length})
              </TabsTrigger>
              <TabsTrigger
                value="features"
                className="flex-1 rounded-full data-[state=active]:bg-[#0f172a] data-[state=active]:text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Features
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-0">
              {filteredVideos.length === 0 ? (
                <div className="text-center py-12">
                  <VideoIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600">No videos found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="guides" className="mt-0">
              {filteredGuides.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600">No guides found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredGuides.map((guide) => (
                    <GuideCard key={guide.id} guide={guide} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="features" className="mt-0">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="font-serif text-2xl font-bold text-[#0f172a] mb-2">
                    What UJRIS Does For You
                  </h2>
                  <p className="text-slate-600">
                    Powerful AI-driven tools that level the playing field
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {features.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Fight Back?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Stop spending hours researching. Let UJRIS analyze your documents and build your case in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a] text-lg px-8">
              <a href="https://tally.so/r/eq2Pqe" target="_blank" rel="noopener noreferrer">
                Start Your Case - £49 <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
            <p className="text-slate-400 text-sm">
              One-time payment. No subscription.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/UJRIS%203D%20LOGO_TRANSPARENT%20BACKGROUND%202-WOnejyAsEuSSKBlOi6k8nTXsGT3mAr.jpg"
                alt="UJRIS"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-serif font-bold text-white">UJRIS</span>
              <span className="text-slate-500 text-sm">Justice Intelligence</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/disclaimer" className="hover:text-white transition-colors">
                Legal Disclaimer
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} UJRIS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
