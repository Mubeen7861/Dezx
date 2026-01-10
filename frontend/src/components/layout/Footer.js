import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

const Footer = ({ content }) => {
  const footerLinks = content?.footer_links || [
    { label: 'Home', url: '/' },
    { label: 'Freelance', url: '/freelance' },
    { label: 'Competitions', url: '/competitions' },
    { label: 'Login', url: '/login' },
    { label: 'Register', url: '/register' },
  ];

  const socialLinks = content?.social_links || [
    { platform: 'Twitter', url: '#', icon: 'twitter' },
    { platform: 'Instagram', url: '#', icon: 'instagram' },
    { platform: 'LinkedIn', url: '#', icon: 'linkedin' },
  ];

  const getSocialIcon = (icon) => {
    switch (icon) {
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'instagram':
        return <Instagram className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  return (
    <footer className="bg-slate-900 text-white" data-testid="footer">
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block">
              <h2 className="text-3xl font-black mb-4">
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  DEZX
                </span>
              </h2>
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              The Freelance + Competition Hub for Designers. Build your portfolio, compete, and grow your career.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.url}
                  to={link.url}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Connect</h3>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-violet-600 hover:text-white transition-all"
                  aria-label={social.platform}
                >
                  {getSocialIcon(social.icon)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <p className="text-slate-500 text-center">
            {content?.footer_text || '© DEZX — The Freelance + Competition Hub for Designers'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
