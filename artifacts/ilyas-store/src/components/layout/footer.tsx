import { Link } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";
import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  const { data: settings } = useGetSettings();
  const contactEmail = (settings as any)?.contactEmail;
  const contactPhone = (settings as any)?.contactPhone;
  const contactAddress = (settings as any)?.contactAddress;
  const facebookUrl = (settings as any)?.facebookUrl;
  const instagramUrl = (settings as any)?.instagramUrl;

  return (
    <footer aria-label="Site footer" className="bg-foreground text-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-serif text-lg font-semibold tracking-wider">ILYAS</span>
              <span className="text-xs tracking-[0.3em] text-background/60 uppercase font-sans">STORE</span>
            </div>
            <p className="text-sm text-background/60 font-sans leading-relaxed mb-6">
              Curated luxury for the discerning few. Perfumes, timepieces, and cosmetics of exceptional provenance.
            </p>
            <div className="flex gap-4">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-white transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-background/60 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-background/40 font-sans mb-4">Contact</h4>
            <ul className="space-y-3">
              {contactEmail && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-background/50 mt-0.5 shrink-0" />
                  <a href={`mailto:${contactEmail}`} className="text-sm text-background/70 hover:text-background transition-colors font-sans">{contactEmail}</a>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-background/50 mt-0.5 shrink-0" />
                  <a href={`tel:${contactPhone}`} className="text-sm text-background/70 hover:text-background transition-colors font-sans">{contactPhone}</a>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-background/50 mt-0.5 shrink-0" />
                  <span className="text-sm text-background/70 font-sans leading-snug">{contactAddress}</span>
                </li>
              )}
              {!contactEmail && !contactPhone && !contactAddress && (
                <li className="text-sm text-background/50 italic font-sans">Contact information not provided.</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-background/40 font-sans mb-4">Shop</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-sm text-background/70 hover:text-background transition-colors font-sans">All Products</Link></li>
              <li><Link href="/products?sort=popular" className="text-sm text-background/70 hover:text-background transition-colors font-sans">Popular Products</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-background/40 font-sans mb-4">Account</h4>
            <ul className="space-y-2">
              <li><Link href="/login" className="text-sm text-background/70 hover:text-background transition-colors font-sans">Sign In</Link></li>
              <li><Link href="/register" className="text-sm text-background/70 hover:text-background transition-colors font-sans">Create Account</Link></li>
              <li><Link href="/orders" className="text-sm text-background/70 hover:text-background transition-colors font-sans">Order History</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/40 font-sans">
            &copy; {new Date().getFullYear()} Ilyas Store. All rights reserved.
          </p>
          <p className="text-xs text-background/30 font-sans tracking-widest uppercase">
            Luxury Curated
          </p>
        </div>
      </div>
    </footer>
  );
}
