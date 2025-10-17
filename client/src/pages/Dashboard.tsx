import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Patient, Profile, supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Dashboard() {
  const { t, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLocation('/login');
        return;
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        toast.error('Failed to load profile');
        return;
      }

      setProfile(profileData);

      // Load patients based on role
      if (profileData.role === 'customer') {
        // Load patients via customer_patient_access
        const { data: accessData } = await supabase
          .from('customer_patient_access')
          .select('patient_id')
          .eq('customer_id', user.id);

        if (accessData && accessData.length > 0) {
          const patientIds = accessData.map(a => a.patient_id);
          const { data: patientsData } = await supabase
            .from('patients')
            .select('*')
            .in('id', patientIds);

          if (patientsData) {
            setPatients(patientsData);
          }
        }
      } else if (profileData.role === 'caregiver') {
        // Load patients via caregiver_assignments (valid assignments only)
        const { data: assignmentsData } = await supabase
          .from('caregiver_assignments')
          .select('patient_id')
          .eq('caregiver_id', user.id)
          .or('end_date.is.null,end_date.gte.' + new Date().toISOString().split('T')[0]);

        if (assignmentsData && assignmentsData.length > 0) {
          const patientIds = assignmentsData.map(a => a.patient_id);
          const { data: patientsData } = await supabase
            .from('patients')
            .select('*')
            .in('id', patientIds);

          if (patientsData) {
            setPatients(patientsData);
          }
        }
      } else if (profileData.role === 'admin') {
        // Load all patients
        const { data: patientsData } = await supabase
          .from('patients')
          .select('*')
          .order('display_name');

        if (patientsData) {
          setPatients(patientsData);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">{t('brand.name')}</h1>
          
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
            
            <div className="text-sm text-gray-600">
              {profile?.full_name || profile?.id}
            </div>
            
            <Button variant="outline" onClick={handleLogout}>
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {t('dashboard.welcome')}, {profile?.full_name || t('dashboard.welcome')}!
            </h2>
            <p className="text-gray-600">
              {profile?.role === 'customer' && t('nav.myFamily')}
              {profile?.role === 'caregiver' && t('nav.myPatients')}
              {profile?.role === 'admin' && t('nav.patients')}
            </p>
          </div>

          {/* Patients Grid */}
          {patients.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">{t('form.noResults')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((patient) => (
                <Link key={patient.id} href={`/patient/${patient.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle>{patient.display_name}</CardTitle>
                      <CardDescription>
                        {patient.birth_date && (
                          <>
                            {t('patient.birthDate')}: {new Date(patient.birth_date).toLocaleDateString()}
                          </>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {patient.notes && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {patient.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

