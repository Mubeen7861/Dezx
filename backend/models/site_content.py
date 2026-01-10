from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

class FeatureCard(BaseModel):
    title: str
    description: str
    icon: Optional[str] = None

class HowItWorksStep(BaseModel):
    step_number: int
    title: str
    description: str

class FAQ(BaseModel):
    question: str
    answer: str

class FooterLink(BaseModel):
    label: str
    url: str

class SocialLink(BaseModel):
    platform: str
    url: str
    icon: str

class ThemeSettings(BaseModel):
    gradient_primary: str = "#8B5CF6"
    gradient_secondary: str = "#6366F1"
    button_style: str = "gradient"

class SiteContent(BaseModel):
    id: str = Field(default="site_content_main")
    hero_headline: str = "Where Designers Compete, Win & Get Clients"
    hero_subheadline: str = "DEZX is a premium platform where designers join challenges, build portfolio proof, and win freelance projects — all in one place."
    primary_cta: str = "Join DEZX"
    secondary_cta: str = "Explore Competitions"
    micro_trust_line: str = "Freelance Projects • Design Competitions • Portfolio Growth • Recognition"
    hero_banner_image: Optional[str] = None
    
    features_title: str = "Launch Features"
    feature_cards: List[FeatureCard] = Field(default_factory=lambda: [
        FeatureCard(
            title="Freelance Marketplace",
            description="Browse design projects, send proposals, and get approved faster. Built to help designers earn and grow.",
            icon="briefcase"
        ),
        FeatureCard(
            title="Design Competitions",
            description="Join weekly and monthly challenges. Improve skills, earn recognition, and get featured publicly.",
            icon="trophy"
        )
    ])
    
    how_it_works_title: str = "How DEZX Works"
    steps: List[HowItWorksStep] = Field(default_factory=lambda: [
        HowItWorksStep(step_number=1, title="Create your designer profile", description="Sign up and showcase your skills"),
        HowItWorksStep(step_number=2, title="Compete or apply for projects", description="Find opportunities that match your expertise"),
        HowItWorksStep(step_number=3, title="Win, grow & get noticed", description="Build your reputation and portfolio")
    ])
    
    reputation_title: str = "Level Up Your Reputation"
    reputation_text: str = "Your activity builds your credibility. Compete, deliver projects, and rise through platform recognition."
    
    faqs: List[FAQ] = Field(default_factory=lambda: [
        FAQ(question="Is DEZX only for UI/UX designers?", answer="No. DEZX is for UI/UX, graphic design, branding, and digital creators."),
        FAQ(question="Can beginners join competitions?", answer="Yes. Competitions are open for all levels and designed to help you grow fast."),
        FAQ(question="How do freelance approvals work?", answer="When you apply, the client reviews proposals and approves the best one. You'll get notified instantly."),
        FAQ(question="Is DEZX free?", answer="DEZX launch may include limited free access. Advanced features will be added soon."),
        FAQ(question="What features are coming next?", answer="Courses, jobs, assets marketplace and verification will be introduced in the next phases.")
    ])
    
    footer_text: str = "© DEZX — The Freelance + Competition Hub for Designers"
    footer_links: List[FooterLink] = Field(default_factory=lambda: [
        FooterLink(label="Home", url="/"),
        FooterLink(label="Freelance", url="/freelance"),
        FooterLink(label="Competitions", url="/competitions"),
        FooterLink(label="Login", url="/login"),
        FooterLink(label="Register", url="/register")
    ])
    social_links: List[SocialLink] = Field(default_factory=lambda: [
        SocialLink(platform="Twitter", url="https://twitter.com", icon="twitter"),
        SocialLink(platform="Instagram", url="https://instagram.com", icon="instagram"),
        SocialLink(platform="LinkedIn", url="https://linkedin.com", icon="linkedin")
    ])
    
    theme_settings: ThemeSettings = Field(default_factory=ThemeSettings)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteContentUpdate(BaseModel):
    hero_headline: Optional[str] = None
    hero_subheadline: Optional[str] = None
    primary_cta: Optional[str] = None
    secondary_cta: Optional[str] = None
    micro_trust_line: Optional[str] = None
    hero_banner_image: Optional[str] = None
    features_title: Optional[str] = None
    feature_cards: Optional[List[FeatureCard]] = None
    how_it_works_title: Optional[str] = None
    steps: Optional[List[HowItWorksStep]] = None
    reputation_title: Optional[str] = None
    reputation_text: Optional[str] = None
    faqs: Optional[List[FAQ]] = None
    footer_text: Optional[str] = None
    footer_links: Optional[List[FooterLink]] = None
    social_links: Optional[List[SocialLink]] = None
    theme_settings: Optional[ThemeSettings] = None
