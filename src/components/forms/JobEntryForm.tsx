import { format } from 'date-fns';
import { Clock, MapPin, User, Wrench, Hotel, Car, Calendar as CalendarIcon, BarChart3, FileText, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FinishJobTab } from '@/components/finish/FinishJobTab';
import { OvertimeTab } from '@/components/overtime/OvertimeTab';
import { ReportTab } from '@/components/reports/ReportTab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { removeDuplicateSeptember10th } from '@/utils/fixDuplicateEntry';

// Utils to handle date-only (YYYY-MM-DD) values without timezone shifts
const parseYmdToLocalDate = (s?: string): Date | undefined => {
  if (!s) return undefined;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

const formatLocalToYmd = (date?: Date): string => (date ? format(date, 'yyyy-MM-dd') : '');

interface JobData {
  travelStart: string;
  travelStartDate: string;
  travelEnd: string;
  travelEndDate: string;
  workStart: string;
  workStartDate: string;
  workEnd: string;
  workEndDate: string;
  departureStart: string;
  departureStartDate: string;
  departureEnd: string;
  departureEndDate: string;
  customerName: string;
  customerAddress: string;
  contactName: string;
  contactPhone: string;
  evaticNo: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  workPerformed: string;
  hotelName: string;
  hotelAddress: string;
  hotelNights: number;
  hotelPrice: number;
  kilometersOutbound: number;
  kilometersReturn: number;
  tollAmount: number;
  plannedDays: number;
  estimatedDays: number;
  // Dynamic time fields for multiple days
  [key: string]: any;
}

interface JobEntryFormProps {
  onJobSaved?: () => void;
  jobId?: string; // For editing existing jobs
}

export const JobEntryForm = ({ onJobSaved, jobId }: JobEntryFormProps) => {
  const { t } = useTranslation();
  const [jobData, setJobData] = useState<Partial<JobData>>({ plannedDays: 1, estimatedDays: 1 });
  const [currentStep, setCurrentStep] = useState<'customer' | 'machine' | 'times' | 'hotel' | 'travel' | 'overtime' | 'report' | 'finish'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(jobId || null);
  const [isEditingJob, setIsEditingJob] = useState(!!jobId);
  const [isCreatingNewJob, setIsCreatingNewJob] = useState(!jobId); // Track if this was originally a new job
  const [currentJob, setCurrentJob] = useState<any>(null);
  const { toast } = useToast();

  // Load existing job data when jobId is provided
  useEffect(() => {
    // Fix duplicate September 10th entry on component mount
    if (jobId) {
      removeDuplicateSeptember10th(jobId).then(() => {
        console.log('Duplicate entry cleanup completed');
      });
    }
    
    const loadJobData = async () => {
      if (jobId) {
        try {
          setIsLoading(true);
          const { data: job, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

          if (error) throw error;

          if (job) {
            // Convert database fields to camelCase for the form
            const daysData = Array.isArray(job.days_data) ? job.days_data : [];
            
            // Initialize job data
            const newJobData: Partial<JobData> = {
              customerName: job.customer_name || '',
              customerAddress: job.customer_address || '',
              contactName: job.contact_name || '',
              contactPhone: job.contact_phone || '',
              evaticNo: job.evatic_no || '',
              manufacturer: job.manufacturer || '',
              model: job.model || '',
              serialNumber: job.serial_number || '',
              workPerformed: job.work_performed || '',
              hotelName: job.hotel_name || '',
              hotelAddress: job.hotel_address || '',
              hotelNights: job.hotel_nights || 0,
              hotelPrice: job.hotel_price || 0,
              kilometersOutbound: job.kilometers_outbound || 0,
              kilometersReturn: job.kilometers_return || 0,
              tollAmount: job.toll_amount || 0,
              plannedDays: daysData.length || 1,
              estimatedDays: job.estimated_days || 1,
            };

            // Load time data from days_data into form fields
            daysData.forEach((dayData, dayIndex) => {
              const day = dayData as any; // Type assertion for JSON data
              if (day.date) {
                newJobData[`dayDate${dayIndex}`] = day.date;
              }
              if (day.travelStart) {
                newJobData[`travelStart${dayIndex}`] = day.travelStart;
              }
              if (day.travelEnd) {
                newJobData[`travelEnd${dayIndex}`] = day.travelEnd;
              }
              if (day.workStart) {
                newJobData[`workStart${dayIndex}`] = day.workStart;
              }
              if (day.workEnd) {
                newJobData[`workEnd${dayIndex}`] = day.workEnd;
              }
              if (day.departureStart) {
                newJobData[`departureStart${dayIndex}`] = day.departureStart;
              }
              if (day.departureEnd) {
                newJobData[`departureEnd${dayIndex}`] = day.departureEnd;
              }
            });

            setJobData(newJobData);
            setCurrentJobId(job.id);
            setCurrentJob(job);
            setIsEditingJob(true);
            setCurrentStep('customer'); // Start at customer tab for consistency
          }
        } catch (error) {
          console.error('Error loading job:', error);
          toast({
            title: t('error'),
            description: t('errorLoadingJob'),
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadJobData();
  }, [jobId, toast, t]);

  // Computed values for UI display
  const isPersisted = Boolean(currentJobId);
  const customerName = jobData.customerName || null;

  const updateField = (field: keyof JobData, value: string | number) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const handleJobUpdate = (updatedJob: any) => {
    setCurrentJob(updatedJob);
    // Persist only the reports field to Supabase to keep DB in sync
    if (updatedJob?.id) {
      supabase
        .from('jobs')
        .update({ reports: updatedJob.reports })
        .eq('id', updatedJob.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating reports:', error);
          }
        });
    }
  };

  const saveJobData = async (isPartialSave = false) => {
    console.log('saveJobData called with isPartialSave:', isPartialSave, 'currentStep:', currentStep, 'isCreatingNewJob:', isCreatingNewJob);
    setIsLoading(true);
    try {
      console.log('Starting saveJobData with data:', jobData, 'currentJobId:', currentJobId);
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('User data:', user);
    
      
      if (!user) {
        throw new Error(t('userNotLoggedIn'));
      }

      const jobPayload = {
        user_id: user.id,
        customer_name: jobData.customerName || '',
        customer_address: jobData.customerAddress || null,
        contact_name: jobData.contactName || null,
        contact_phone: jobData.contactPhone || null,
        evatic_no: jobData.evaticNo || null,
        manufacturer: jobData.manufacturer || null,
        model: jobData.model || null,
        serial_number: jobData.serialNumber || null,
        work_performed: jobData.workPerformed || null,
        hotel_name: jobData.hotelName || null,
        hotel_address: jobData.hotelAddress || null,
        hotel_nights: jobData.hotelNights || 0,
        hotel_price: jobData.hotelPrice || 0,
        kilometers_outbound: jobData.kilometersOutbound || 0,
        kilometers_return: jobData.kilometersReturn || 0,
        toll_amount: jobData.tollAmount || 0,
        travel_start_time: jobData.travelStart || null,
        travel_start_date: jobData.travelStartDate || null,
        travel_end_time: jobData.travelEnd || null,
        travel_end_date: jobData.travelEndDate || null,
        work_start_time: jobData.workStart || null,
        work_start_date: jobData.workStartDate || null,
        work_end_time: jobData.workEnd || null,
        work_end_date: jobData.workEndDate || null,
        departure_start_time: jobData.departureStart || null,
        departure_start_date: jobData.departureStartDate || null,
        departure_end_time: jobData.departureEnd || null,
        departure_end_date: jobData.departureEndDate || null,
        status: isPartialSave ? 'open' : 'completed'
      };

      let data, error;

      if (currentJobId && isEditingJob) {
        // Update existing job
        const result = await supabase
          .from('jobs')
          .update(jobPayload)
          .eq('id', currentJobId)
          .select()
          .single();
        data = result.data;
        error = result.error;

        if (!error && data) {
          // Keep local state in sync (camelCase)
          setJobData(prev => ({ 
            ...prev, 
            customerName: data.customer_name,
            customerAddress: data.customer_address,
            contactName: data.contact_name,
            contactPhone: data.contact_phone,
            evaticNo: data.evatic_no,
            manufacturer: data.manufacturer,
            model: data.model,
            serialNumber: data.serial_number,
            workPerformed: data.work_performed,
            hotelName: data.hotel_name,
            hotelAddress: data.hotel_address,
            hotelNights: data.hotel_nights,
            hotelPrice: data.hotel_price,
            kilometersOutbound: data.kilometers_outbound,
            kilometersReturn: data.kilometers_return,
            tollAmount: data.toll_amount,
          }));
        }
      } else {
        // Create new job
        const result = await supabase
          .from('jobs')
          .insert(jobPayload)
          .select()
          .single();
        data = result.data;
        error = result.error;
        
        if (!error && data) {
          setCurrentJobId(data.id);
          setIsEditingJob(true);
          // Update local jobData with saved data to trigger UI refresh, converting back to camelCase
          setJobData(prev => ({ 
            ...prev, 
            customerName: data.customer_name,
            customerAddress: data.customer_address,
            contactName: data.contact_name,
            contactPhone: data.contact_phone,
            evaticNo: data.evatic_no,
            manufacturer: data.manufacturer,
            model: data.model,
            serialNumber: data.serial_number,
            workPerformed: data.work_performed,
            hotelName: data.hotel_name,
            hotelAddress: data.hotel_address,
            hotelNights: data.hotel_nights,
            hotelPrice: data.hotel_price,
            kilometersOutbound: data.kilometers_outbound,
            kilometersReturn: data.kilometers_return,
            tollAmount: data.toll_amount,
          }));
        }
      }

      console.log('Save result:', { data, error });
      if (error) throw error;

      toast({
        title: t('successfullySaved'),
        description: isPartialSave 
          ? t('jobDataSaved')
          : t('jobCompleted')
      });

      // After saving customer data, automatically go to next step
      if (isPartialSave && currentStep === 'customer' && !error && data) {
        setCurrentStep('machine');
        toast({
          title: t('customerSavedGoMachineTitle'),
          description: t('customerSavedGoMachineDesc')
        });
      }

      if (!isPartialSave) {
        // Reset form only when job is completed
        setJobData({});
        setCurrentStep('customer');
        setCurrentJobId(null);
        setIsEditingJob(false);
        onJobSaved?.();
      }

      console.log('saveJobData completed successfully, isPartialSave:', isPartialSave);
      return true; // Indicate success
      
    } catch (error) {
      console.error('Detailed error beim Speichern:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: t('error'),
        description: t('errorSaving'),
        variant: 'destructive'
      });
      return false; // Indicate failure
    } finally {
      setIsLoading(false);
    }
  };

  };


  const renderTimesSection = () => {
    const plannedDays = jobData.plannedDays || 1;
    console.log('renderTimesSection - plannedDays:', plannedDays);
    
    return (
      <div className="space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {t('times')}
          </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="planned-days" className="text-sm font-medium">{t('plannedDays')}</Label>
              <Input
                id="planned-days"
                type="number"
                min="1"
                max="30"
                placeholder="1"
                value={jobData.plannedDays || ''}
                onChange={(e) => updateField('plannedDays', parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Zeit-Eingaben für jeden geplanten Tag */}
        {Array.from({ length: plannedDays }, (_, dayIndex) => (
          <Card key={dayIndex} className="border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{`${t('timesTitle')} ${dayIndex + 1}/${plannedDays}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">{/* Reduced spacing */}
              {/* Datum für den ganzen Tag */}
              <div className="mb-3">
                <Label htmlFor={`day-date-${dayIndex}`} className="text-xs font-medium text-muted-foreground mb-1 block">{t('date')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal h-8",
                          !jobData[`dayDate${dayIndex}` as keyof JobData] && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        <span className="text-xs">
                          {jobData[`dayDate${dayIndex}` as keyof JobData]
                            ? parseYmdToLocalDate(jobData[`dayDate${dayIndex}` as keyof JobData] as string)?.toLocaleDateString('de-DE')
                            : t('times.selectDate')
                          }
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={parseYmdToLocalDate(jobData[`dayDate${dayIndex}` as keyof JobData] as string)}
                        onSelect={(date) => {
                          if (date) {
                            const fieldName = `dayDate${dayIndex}` as keyof JobData;
                            updateField(fieldName, formatLocalToYmd(date));
                          }
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
              </div>

              {/* Kompakte Zeit-Eingaben */}
              <div className="space-y-3">
                {/* Anreise */}
                <div className="bg-muted/20 rounded-lg p-3">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('times.arrival')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`travel-start-${dayIndex}`} className="text-xs text-muted-foreground">{t('times.startTime')}</Label>
                      <Input
                        id={`travel-start-${dayIndex}`}
                        type="time"
                        value={jobData[`travelStart${dayIndex}`] || ''}
                        onChange={(e) => updateField(`travelStart${dayIndex}` as any, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`travel-end-${dayIndex}`} className="text-xs text-muted-foreground">{t('times.endTime')}</Label>
                      <Input
                        id={`travel-end-${dayIndex}`}
                        type="time"
                        value={jobData[`travelEnd${dayIndex}`] || ''}
                        onChange={(e) => updateField(`travelEnd${dayIndex}` as any, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Arbeit */}
                <div className="bg-primary/5 rounded-lg p-3">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('times.work')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`work-start-${dayIndex}`} className="text-xs text-muted-foreground">{t('times.startTime')}</Label>
                      <Input
                        id={`work-start-${dayIndex}`}
                        type="time"
                        value={jobData[`workStart${dayIndex}`] || ''}
                        onChange={(e) => updateField(`workStart${dayIndex}` as any, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`work-end-${dayIndex}`} className="text-xs text-muted-foreground">{t('times.endTime')}</Label>
                      <Input
                        id={`work-end-${dayIndex}`}
                        type="time"
                        value={jobData[`workEnd${dayIndex}`] || ''}
                        onChange={(e) => updateField(`workEnd${dayIndex}` as any, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Abreise */}
                <div className="bg-muted/20 rounded-lg p-3">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">{t('times.departure')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`departure-start-${dayIndex}`} className="text-xs text-muted-foreground">{t('times.startTime')}</Label>
                      <Input
                        id={`departure-start-${dayIndex}`}
                        type="time"
                        value={jobData[`departureStart${dayIndex}`] || ''}
                        onChange={(e) => updateField(`departureStart${dayIndex}` as any, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`departure-end-${dayIndex}`} className="text-xs text-muted-foreground">{t('times.endTime')}</Label>
                      <Input
                        id={`departure-end-${dayIndex}`}
                        type="time"
                        value={jobData[`departureEnd${dayIndex}`] || ''}
                        onChange={(e) => updateField(`departureEnd${dayIndex}` as any, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Speichern Button für diesen Tag */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => saveJobData(true)}
                  disabled={isLoading || !customerName}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? t('saving') : `Zeiten für Tag ${dayIndex + 1} speichern`}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderOvertimeSection = () => {
    if (!isEditingJob || !currentJobId) {
      return (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{t('saveJobFirst')}</p>
          </CardContent>
        </Card>
      );
    }

    const mockJob = {
      id: currentJobId,
      customer_name: jobData.customerName || '',
      // Add other required fields for the OvertimeTab
    };

    return <OvertimeTab job={mockJob as any} />;
  };

  const renderReportSection = () => {
    if (!isEditingJob || !currentJobId || !currentJob) {
      return (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{t('saveJobFirst')}</p>
          </CardContent>
        </Card>
      );
    }

    return <ReportTab job={currentJob} onJobUpdate={handleJobUpdate} />;
  };

  const renderFinishSection = () => {
    if (!isEditingJob || !currentJobId) {
      return (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{t('saveJobFirst')}</p>
          </CardContent>
        </Card>
      );
    }

    const mockJob = {
      id: currentJobId,
      customer_name: jobData.customerName || '',
      // Add other required fields for the FinishJobTab
    };

    return <FinishJobTab job={mockJob as any} onJobUpdate={() => {}} onCloseDialog={() => {}} />;
  };

  const renderCustomerSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-primary" />
          {t('customerData')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="customer-name" className="text-sm font-medium">
            {t('customerName')} <Badge variant="destructive" className="ml-1 text-xs">{t('required')}</Badge>
          </Label>
          <Input
            id="customer-name"
            placeholder={t('customerName')}
            value={jobData.customerName || ''}
            onChange={(e) => updateField('customerName', e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="customer-address" className="text-sm font-medium">{t('customerAddress')}</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="customer-address"
              placeholder={t('customerAddress')}
              value={jobData.customerAddress || ''}
              onChange={(e) => updateField('customerAddress', e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="contact-name" className="text-sm font-medium">Kontaktperson</Label>
          <Input
            id="contact-name"
            placeholder="z. B. Max Mustermann"
            value={jobData.contactName || ''}
            onChange={(e) => updateField('contactName', e.target.value)}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="contact-phone" className="text-sm font-medium">Telefon (Kontaktperson)</Label>
          <Input
            id="contact-phone"
            placeholder="z. B. +49 171 1234567"
            value={jobData.contactPhone || ''}
            onChange={(e) => updateField('contactPhone', e.target.value)}
            className="mt-1"
            pattern="^[+0-9 ()-]{5,}$"
          />
        </div>
        
        <div>
          <Label htmlFor="evatic-no" className="text-sm font-medium">{t('evaticNo')}</Label>
          <Input
            id="evatic-no"
            placeholder={t('evaticNo')}
            value={jobData.evaticNo || ''}
            onChange={(e) => updateField('evaticNo', e.target.value)}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderMachineSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          {t('machineData')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="manufacturer" className="text-sm font-medium">{t('manufacturer')}</Label>
            <Input
              id="manufacturer"
              placeholder={t('manufacturer')}
              value={jobData.manufacturer || ''}
              onChange={(e) => updateField('manufacturer', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="model" className="text-sm font-medium">{t('model')}</Label>
            <Input
              id="model"
              placeholder={t('model')}
              value={jobData.model || ''}
              onChange={(e) => updateField('model', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="serial" className="text-sm font-medium">{t('serialNumber')}</Label>
            <Input
              id="serial"
              placeholder={t('serialNumber')}
              value={jobData.serialNumber || ''}
              onChange={(e) => updateField('serialNumber', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="work-performed" className="text-sm font-medium">{t('workPerformed')}</Label>
          <Textarea
            id="work-performed"
            placeholder={t('workPerformedPlaceholder')}
            value={jobData.workPerformed || ''}
            onChange={(e) => updateField('workPerformed', e.target.value)}
            className="mt-1 min-h-20"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderHotelSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hotel className="h-5 w-5 text-primary" />
          {t('hotelData')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="hotel-name" className="text-sm font-medium">{t('customer.hotelName')}</Label>
            <Input
              id="hotel-name"
              placeholder={t('customer.hotelNamePlaceholder')}
              value={jobData.hotelName || ''}
              onChange={(e) => updateField('hotelName', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hotel-address" className="text-sm font-medium">{t('customer.hotelAddress')}</Label>
            <Input
              id="hotel-address"
              placeholder={t('customer.hotelAddressPlaceholder')}
              value={jobData.hotelAddress || ''}
              onChange={(e) => updateField('hotelAddress', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hotel-nights" className="text-sm font-medium">{t('customer.hotelNights')}</Label>
            <Input
              id="hotel-nights"
              type="number"
              min="0"
              placeholder="0"
              value={jobData.hotelNights || ''}
              onChange={(e) => updateField('hotelNights', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="hotel-price" className="text-sm font-medium">{t('customer.hotelPrice')}</Label>
            <Input
              id="hotel-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={jobData.hotelPrice || ''}
              onChange={(e) => updateField('hotelPrice', parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTravelSection = () => (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5 text-primary" />
          {t('travel')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Per-day travel fields */}
        <div className="space-y-4">
          <h4 className="font-medium">{t('travelPerDay')} ({jobData.plannedDays || 1} {t('days')})</h4>
          
          {Array.from({ length: jobData.plannedDays || 1 }, (_, index) => (
            <Card key={index} className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('day')} {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">{t('travelThere')}</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">{t('travelBack')}</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">{t('tollsNorwegian')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Steps configuration - different for new job vs editing
  const newJobSteps = [
    { id: 'customer', label: t('customerData'), icon: User },
    { id: 'machine', label: t('machineData'), icon: Wrench },
  ] as const;

  const editJobStepsRow1 = [
    { id: 'customer', label: t('customerData'), icon: User },
    { id: 'machine', label: t('machineData'), icon: Wrench },
    { id: 'times', label: t('times'), icon: CalendarIcon },
    { id: 'hotel', label: t('hotelData'), icon: Hotel },
  ] as const;

  const editJobStepsRow2 = [
    { id: 'travel', label: t('travel'), icon: Car },
    { id: 'overtime', label: t('overtime'), icon: BarChart3 },
    { id: 'report', label: t('report'), icon: FileText },
    { id: 'finish', label: t('finish'), icon: CheckCircle },
  ] as const;

  const steps = (isEditingJob && !isCreatingNewJob) ? [...editJobStepsRow1, ...editJobStepsRow2] : newJobSteps;

  // Auto-navigate to Hotel tab when a hotel name is entered
  useEffect(() => {
    const has = Boolean(jobData.hotelName && jobData.hotelName.trim().length > 0);
    console.info('UI: hasHotel changed', { hotelName: jobData.hotelName, has });
    if (isEditingJob && has && currentStep !== 'hotel') {
      setCurrentStep('hotel');
    }
  }, [jobData.hotelName, isEditingJob]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 space-y-6">
        {/* Job Title with Customer Name */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {(isEditingJob && !isCreatingNewJob) ? t('editJob') : t('newJob')}
            {isPersisted && customerName && (
              <span data-testid="job-title-customer" className="ml-2 text-muted-foreground">— {customerName}</span>
            )}
          </h2>
          {(isEditingJob && !isCreatingNewJob) && (
            <Badge variant="secondary" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {t('jobEditing')}
            </Badge>
          )}
        </div>

        {/* Step Navigation */}
        {(isEditingJob && !isCreatingNewJob) ? (
          // 2-row layout for editing mode
          <div className="space-y-2">
            {/* Row 1: Customer, Machine, Times, Hotel */}
            <div className="flex justify-between items-center gap-1">
              {editJobStepsRow1.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = [...editJobStepsRow1, ...editJobStepsRow2].findIndex(s => s.id === currentStep) > [...editJobStepsRow1, ...editJobStepsRow2].indexOf(step);
                
                return (
                  <Button
                    key={step.id}
                    variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(step.id as typeof currentStep)}
                    className="flex-1 mx-0.5"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </Button>
                );
              })}
            </div>
            
            {/* Row 2: Travel, Overtime, Report, Finish */}
            <div className="flex justify-between items-center gap-1">
              {editJobStepsRow2.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = [...editJobStepsRow1, ...editJobStepsRow2].findIndex(s => s.id === currentStep) > [...editJobStepsRow1, ...editJobStepsRow2].indexOf(step);
                
                return (
                  <Button
                    key={step.id}
                    variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(step.id as typeof currentStep)}
                    className="flex-1 mx-0.5"
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{step.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ) : (
          // Single row layout for new job
          <div className="flex justify-between items-center">
            {newJobSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = newJobSteps.findIndex(s => s.id === currentStep) > index;
              const isAccessible = step.id === 'customer' || (step.id === 'machine' && isPersisted); // Allow machine once customer saved
              
              return (
                <Button
                  key={step.id}
                  variant={isActive ? "default" : isCompleted ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isAccessible) {
                      setCurrentStep(step.id as any);
                    } else {
                      toast({
                        title: t('saveCustomerFirst'),
                        description: t('saveCustomerFirstDesc'),
                        variant: 'destructive'
                      });
                    }
                  }}
                  className={`flex-1 mx-1 ${!isAccessible ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!isAccessible}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{step.label}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* Context Bar - Customer Info */}
        {isPersisted && customerName && (
          <div data-testid="job-context-bar" className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <span className="font-medium">Kunde:</span> {customerName}
            </span>
          </div>
        )}

        <Separator />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Current Step Content */}
        {currentStep === 'customer' && renderCustomerSection()}
        {currentStep === 'machine' && renderMachineSection()}
        {currentStep === 'times' && renderTimesSection()}
        {currentStep === 'hotel' && renderHotelSection()}
        {currentStep === 'travel' && renderTravelSection()}
        {currentStep === 'overtime' && renderOvertimeSection()}
        {currentStep === 'report' && renderReportSection()}
        {currentStep === 'finish' && renderFinishSection()}

        {/* Status Indicator */}
        {isEditingJob && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center my-4">
            <p className="text-sm text-blue-700">
              📝 {t('jobEditing')} • {t('jobIdShort')}: {currentJobId?.slice(0, 8)}... 
              {currentStep !== 'customer' && <span className="ml-2">{t('addMoreData')}</span>}
            </p>
          </div>
        )}
      </div>

      {/* Fixed Navigation Buttons */}
      <div className="p-4 border-t bg-background">
        <div className="flex justify-between items-center gap-2">
          {/* Left: Back button */}
          <Button
            variant="outline"
            onClick={() => {
              const currentIndex = steps.findIndex(s => s.id === currentStep);
              if (currentIndex > 0) {
                setCurrentStep(steps[currentIndex - 1].id as any);
              }
            }}
            disabled={currentStep === 'customer'}
          >
            {t('back')}
          </Button>
          
          {/* Center: Dashboard button */}
          <Button
            variant="outline"
            onClick={() => onJobSaved?.()}
            disabled={isLoading}
          >
            Dashboard
          </Button>
          
          {/* Right: Next/Action button */}
          <Button
            onClick={async () => {
              if (currentStep === 'customer') {
                // Save customer data (partial save)
                await saveJobData(true);
              } else if (currentStep === 'machine' && isCreatingNewJob) {
                // For new jobs: save and return to dashboard
                console.log('Machine step for new job - attempting to save and return to dashboard');
                try {
                  const success = await saveJobData(true);
                  console.log('Save result:', success);
                  if (success) {
                    console.log('Save successful, calling onJobSaved');
                    onJobSaved?.();
                  } else {
                    console.error('Save failed, not returning to dashboard');
                  }
                } catch (error) {
                  console.error('Error in machine step save:', error);
                }
              } else {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id as any);
                } else if (currentStep === 'finish') {
                  // Complete the job
                  await saveJobData(false);
                }
              }
            }}
            disabled={isLoading || (currentStep === 'customer' && !jobData.customerName)}
          >
            {isLoading ? t('save') : 
             currentStep === 'customer' ? t('next') : 
             currentStep === 'machine' && isCreatingNewJob ? t('dashboard') :
             currentStep === 'finish' ? t('completeJob') : 
             t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
};