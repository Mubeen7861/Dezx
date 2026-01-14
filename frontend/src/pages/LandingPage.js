import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Trophy, 
  Star, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { contentAPI } from '../lib/api';

const LandingPage = () => {
  const [content, setContent] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await contentAPI.get();
        setContent(response.data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const getFeatureIcon = (icon) => {
    switch (icon) {
      case 'briefcase':
        return <Briefcase className="w-7 h-7" />;
      case 'trophy':
        return <Trophy className="w-7 h-7" />;
      default:
        return <Star className="w-7 h-7" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const heroHeadline = content?.hero_headline || "Where Designers Compete, Win & Get Clients";
  const heroSubheadline = content?.hero_subheadline || "DEZX is a premium platform where designers join challenges, build portfolio proof, and win freelance projects — all in one place.";
  const primaryCTA = content?.primary_cta || "Join DEZX";
  const secondaryCTA = content?.secondary_cta || "Explore Competitions";
  const microTrustLine = content?.micro_trust_line || "Freelance Projects • Design Competitions • Portfolio Growth • Recognition";

  const featureCards = content?.feature_cards || [
    { title: "Freelance Marketplace", description: "Browse design projects, send proposals, and get approved faster.", icon: "briefcase" },
    { title: "Design Competitions", description: "Join weekly and monthly challenges. Improve skills, earn recognition.", icon: "trophy" }
  ];

  const steps = content?.steps || [
    { step_number: 1, title: "Create your designer profile", description: "Sign up and showcase your skills" },
    { step_number: 2, title: "Compete or apply for projects", description: "Find opportunities that match your expertise" },
    { step_number: 3, title: "Win, grow & get noticed", description: "Build your reputation and portfolio" }
  ];

  const faqs = content?.faqs || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="landing-page">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 overflow-hidden" data-testid="hero-section">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-200/40 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="container relative">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Now in Beta
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="heading-hero font-black text-slate-900 mb-6"
            >
              {heroHeadline.split(' ').map((word, i) => (
                <span key={i}>
                  {word === 'Compete,' || word === 'Win' || word === 'Clients' ? (
                    <span className="gradient-text">{word}</span>
                  ) : (
                    word
                  )}{' '}
                </span>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto"
            >
              {heroSubheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/register"
                className="btn-gradient text-lg px-8 py-4 inline-flex items-center justify-center gap-2"
                data-testid="hero-join-btn"
              >
                {primaryCTA}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/competitions"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
                data-testid="hero-explore-btn"
              >
                {secondaryCTA}
              </Link>
            </motion.div>

            {/* Trust Line */}
            <motion.p variants={fadeInUp} className="text-sm text-slate-500">
              {microTrustLine}
            </motion.p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {[
              { value: '500+', label: 'Designers', icon: Users },
              { value: '150+', label: 'Projects', icon: Briefcase },
              { value: '50+', label: 'Competitions', icon: Trophy },
              { value: '98%', label: 'Satisfaction', icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                <p className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white" data-testid="features-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              {content?.features_title || "Launch Features"}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to grow as a designer
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {featureCards.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="premium-card p-8"
                data-testid={`feature-card-${i}`}
              >
                <div className="feature-icon mb-6">
                  {getFeatureIcon(feature.icon)}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
                <Link
                  to={feature.icon === 'briefcase' ? '/freelance' : '/competitions'}
                  className="inline-flex items-center gap-2 mt-6 text-violet-600 font-semibold hover:gap-3 transition-all"
                >
                  Explore {feature.icon === 'briefcase' ? 'Projects' : 'Competitions'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section" data-testid="how-it-works-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              {content?.how_it_works_title || "How DEZX Works"}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start your journey in three simple steps
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-6 mb-8 last:mb-0"
              >
                <div className="flex-shrink-0">
                  <div className="step-number">{step.step_number}</div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 h-12 bg-gradient-to-b from-violet-500 to-transparent mx-auto mt-2" />
                  )}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reputation Teaser Section */}
      <section className="section bg-gradient-to-br from-violet-600 to-indigo-600" data-testid="reputation-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Award className="w-16 h-16 mx-auto mb-6 text-white/80" />
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              {content?.reputation_title || "Level Up Your Reputation"}
            </h2>
            <p className="text-xl text-white/80 leading-relaxed mb-8">
              {content?.reputation_text || "Your activity builds your credibility. Compete, deliver projects, and rise through platform recognition."}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-violet-600 rounded-full font-semibold text-lg hover:bg-violet-50 transition-colors"
            >
              Start Building
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="section" data-testid="faqs-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Got questions? We've got answers.
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="faq-item bg-white"
                data-testid={`faq-item-${i}`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-violet-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
{expandedFaq === i && (
  <motion.div
    initial={{ opacity: 0, scaleY: 0 }}
    animate={{ opacity: 1, scaleY: 1 }}
    exit={{ opacity: 0, scaleY: 0 }}
    transition={{ duration: 0.25 }}
    style={{ transformOrigin: "top" }}
    className="overflow-hidden"
  >
    <div className="px-6 pb-5">
      <p className="pt-2 text-slate-600 leading-relaxed">
        {faq.answer}
      </p>
    </div>
  </motion.div>
)}

                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-white" data-testid="cta-section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center premium-card p-12 md:p-16 bg-gradient-to-br from-slate-900 to-slate-800"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
              Join thousands of designers building their careers on DEZX.
            </p>
            <Link
              to="/register"
              className="btn-gradient text-lg px-10 py-4 inline-flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer content={content} />
    </div>
  );
};

export default LandingPage;
