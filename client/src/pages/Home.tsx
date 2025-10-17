import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { submitLead } from "@/lib/supabase";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [caregiverForm, setCaregiverForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await submitLead({
      type: 'customer',
      ...customerForm,
    });

    if (result.success) {
      toast.success(t('lead.customer.success'));
      setCustomerForm({ name: '', email: '', phone: '', message: '' });
    } else {
      toast.error(result.error || t('lead.customer.error'));
    }
    
    setIsSubmitting(false);
  };

  const handleCaregiverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await submitLead({
      type: 'caregiver',
      ...caregiverForm,
    });

    if (result.success) {
      toast.success(t('lead.caregiver.success'));
      setCaregiverForm({ name: '', email: '', phone: '', message: '' });
    } else {
      toast.error(result.error || t('lead.caregiver.error'));
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">{t('brand.name')}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex gap-2">
              <Button
                variant={language === 'de' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('de')}
              >
                DE
              </Button>
              <Button
                variant={language === 'sl' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('sl')}
              >
                SL
              </Button>
            </div>
            
            <Link href="/login">
              <Button>{t('nav.login')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            {t('hero.title')}
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="#customer-form">{t('hero.ctaCustomer')}</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#caregiver-form">{t('hero.ctaCaregiver')}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">{t('trust.title')}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('trust.feature1')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('trust.feature1Desc')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('trust.feature2')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('trust.feature2Desc')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('trust.feature3')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('trust.feature3Desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">{t('services.title')}</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('services.service1')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('services.service1Desc')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('services.service2')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('services.service2Desc')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('services.service3')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{t('services.service3Desc')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lead Forms Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Customer Form */}
            <Card id="customer-form">
              <CardHeader>
                <CardTitle>{t('lead.customer.title')}</CardTitle>
                <CardDescription>{t('lead.customer.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCustomerSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="customer-name">{t('lead.customer.name')}</Label>
                    <Input
                      id="customer-name"
                      required
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customer-email">{t('lead.customer.email')}</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      required
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customer-phone">{t('lead.customer.phone')}</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      required
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="customer-message">{t('lead.customer.message')}</Label>
                    <Textarea
                      id="customer-message"
                      value={customerForm.message}
                      onChange={(e) => setCustomerForm({ ...customerForm, message: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t('form.loading') : t('lead.customer.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Caregiver Form */}
            <Card id="caregiver-form">
              <CardHeader>
                <CardTitle>{t('lead.caregiver.title')}</CardTitle>
                <CardDescription>{t('lead.caregiver.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCaregiverSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="caregiver-name">{t('lead.caregiver.name')}</Label>
                    <Input
                      id="caregiver-name"
                      required
                      value={caregiverForm.name}
                      onChange={(e) => setCaregiverForm({ ...caregiverForm, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="caregiver-email">{t('lead.caregiver.email')}</Label>
                    <Input
                      id="caregiver-email"
                      type="email"
                      required
                      value={caregiverForm.email}
                      onChange={(e) => setCaregiverForm({ ...caregiverForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="caregiver-phone">{t('lead.caregiver.phone')}</Label>
                    <Input
                      id="caregiver-phone"
                      type="tel"
                      required
                      value={caregiverForm.phone}
                      onChange={(e) => setCaregiverForm({ ...caregiverForm, phone: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="caregiver-message">{t('lead.caregiver.message')}</Label>
                    <Textarea
                      id="caregiver-message"
                      required
                      value={caregiverForm.message}
                      onChange={(e) => setCaregiverForm({ ...caregiverForm, message: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t('form.loading') : t('lead.caregiver.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">{t('footer.tagline')}</p>
            <div className="flex gap-6">
              <Link href="/impressum">
                <a className="text-gray-400 hover:text-white">{t('footer.legal.imprint')}</a>
              </Link>
              <Link href="/datenschutz">
                <a className="text-gray-400 hover:text-white">{t('footer.legal.privacy')}</a>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

