import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { CareLog, Document, getSignedDocumentUrl, Patient, Profile, supabase, Task, Vital } from "@/lib/supabase";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

interface PatientDetailProps {
  patientId: string;
}

export default function PatientDetail({ patientId }: PatientDetailProps) {
  const { t, language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vitalsFilter, setVitalsFilter] = useState<30 | 90>(30);

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      // Get current user and profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLocation('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);

      // Load patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        toast.error('Patient not found');
        setLocation('/dashboard');
        return;
      }

      setPatient(patientData);

      // Load vitals (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: vitalsData } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .gte('measured_at', ninetyDaysAgo.toISOString())
        .order('measured_at', { ascending: true });

      if (vitalsData) {
        setVitals(vitalsData);
      }

      // Load care logs (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: careLogsData } = await supabase
        .from('care_logs')
        .select('*')
        .eq('patient_id', patientId)
        .gte('occurred_at', sevenDaysAgo.toISOString())
        .order('occurred_at', { ascending: false });

      if (careLogsData) {
        setCareLogs(careLogsData);
      }

      // Load tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setTasks(tasksData);
      }

      // Load documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (documentsData) {
        setDocuments(documentsData);
      }

    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation('/login');
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const url = await getSignedDocumentUrl(doc.path);
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  // Prepare vitals chart data
  const getVitalsChartData = (type: string) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - vitalsFilter);

    return vitals
      .filter(v => v.type === type && new Date(v.measured_at) >= cutoffDate)
      .map(v => ({
        date: format(new Date(v.measured_at), 'MM/dd'),
        value: v.value || 0,
        systolic: v.systolic || 0,
        diastolic: v.diastolic || 0,
      }));
  };

  const bloodPressureData = getVitalsChartData('blood_pressure');
  const heartRateData = getVitalsChartData('heart_rate');
  const temperatureData = getVitalsChartData('temperature');
  const oxygenData = getVitalsChartData('oxygen_saturation');
  const glucoseData = getVitalsChartData('blood_glucose');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">← {t('nav.dashboard')}</Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">{patient.display_name}</h1>
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
          {/* Patient Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{patient.display_name}</CardTitle>
              <CardDescription>
                {patient.birth_date && (
                  <span>{t('patient.birthDate')}: {format(new Date(patient.birth_date), 'PP')}</span>
                )}
              </CardDescription>
            </CardHeader>
            {patient.notes && (
              <CardContent>
                <p className="text-gray-600">{patient.notes}</p>
              </CardContent>
            )}
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="vitals" className="space-y-6">
            <TabsList>
              <TabsTrigger value="vitals">{t('patient.vitals')}</TabsTrigger>
              <TabsTrigger value="careLogs">{t('patient.careLogs')}</TabsTrigger>
              <TabsTrigger value="tasks">{t('patient.tasks')}</TabsTrigger>
              <TabsTrigger value="documents">{t('patient.documents')}</TabsTrigger>
            </TabsList>

            {/* Vitals Tab */}
            <TabsContent value="vitals" className="space-y-6">
              <div className="flex justify-end gap-2">
                <Button
                  variant={vitalsFilter === 30 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVitalsFilter(30)}
                >
                  {t('vitals.last30Days')}
                </Button>
                <Button
                  variant={vitalsFilter === 90 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVitalsFilter(90)}
                >
                  {t('vitals.last90Days')}
                </Button>
              </div>

              {/* Blood Pressure Chart */}
              {bloodPressureData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('vitals.bloodPressure')} (mmHg)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={bloodPressureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" name={t('vitals.systolic')} />
                        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name={t('vitals.diastolic')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Heart Rate Chart */}
              {heartRateData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('vitals.heartRate')} (bpm)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={heartRateData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#10b981" name={t('vitals.heartRate')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Temperature Chart */}
              {temperatureData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('vitals.temperature')} (°C)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={temperatureData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[35, 40]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#f59e0b" name={t('vitals.temperature')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Oxygen Saturation Chart */}
              {oxygenData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('vitals.oxygenSaturation')} (%)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={oxygenData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[90, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" name={t('vitals.oxygenSaturation')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Blood Glucose Chart */}
              {glucoseData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('vitals.bloodGlucose')} (mg/dL)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={glucoseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#ec4899" name={t('vitals.bloodGlucose')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {vitals.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">{t('form.noResults')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Care Logs Tab */}
            <TabsContent value="careLogs" className="space-y-4">
              {careLogs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">{t('form.noResults')}</p>
                  </CardContent>
                </Card>
              ) : (
                careLogs.map((log) => (
                  <Card key={log.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{log.title || t(`careLog.${log.slot}`)}</CardTitle>
                          <CardDescription>
                            {format(new Date(log.occurred_at), 'PPp')} • {t(`careLog.${log.slot}`)}
                          </CardDescription>
                        </div>
                        {log.mood && (
                          <div className="text-2xl">
                            {log.mood}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {log.details && (
                      <CardContent>
                        <p className="text-gray-600">{log.details}</p>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-4">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">{t('form.noResults')}</p>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          <CardDescription>
                            {task.due_at && (
                              <>
                                {t('task.dueAt')}: {format(new Date(task.due_at), 'PPp')}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          task.status === 'done' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t(`task.${task.status}`)}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              {documents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-500">{t('form.noResults')}</p>
                  </CardContent>
                </Card>
              ) : (
                documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">{doc.label || doc.path.split('/').pop()}</CardTitle>
                          <CardDescription>
                            {format(new Date(doc.created_at), 'PPp')}
                          </CardDescription>
                        </div>
                        <Button onClick={() => handleDownloadDocument(doc)}>
                          {t('document.download')}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

