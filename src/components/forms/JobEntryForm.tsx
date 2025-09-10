import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, User, Wrench, Hotel, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface JobEntryFormProps {
  onJobSaved?: () => void;
}

export const JobEntryForm = ({ onJobSaved }: JobEntryFormProps) => {
  const { t } = useTranslation();
  const [jobData, setJobData] = useState<Partial<JobData>>({ plannedDays: 1 });
  const [currentStep, setCurrentStep] = useState<'customer' | 'machine' | 'hotel' | 'travel'>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const { toast } = useToast();

  // Computed values for UI display
  const isPersisted = Boolean(currentJobId);
  const customerName = jobData.customerName || null;

  const updateField = (field: keyof JobData, value: string | number) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentTime = () => {
    return new Date().toTimeString().slice(0, 5);
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const saveJobData = async (isPartialSave = false) => {
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
      
    } catch (error) {
      console.error('Detailed error beim Speichern:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: t('error'),
        description: t('errorSaving'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewJob = () => {
    setJobData({ 
      plannedDays: 1,
      hotelPrice: 0
    });
    setCurrentStep('customer');
    setCurrentJobId(null);
    setIsEditingJob(false);
    toast({
      title: t('newJob'),
      description: t('newJobStarted')
    });
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="km-outbound" className="text-sm font-medium">{t('kmOutbound')}</Label>
            <Input
              id="km-outbound"
              type="number"
              min="0"
              placeholder="0"
              value={jobData.kilometersOutbound || ''}
              onChange={(e) => updateField('kilometersOutbound', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="km-return" className="text-sm font-medium">{t('kmReturn')}</Label>
            <Input
              id="km-return"
              type="number"
              min="0"
              placeholder="0"
              value={jobData.kilometersReturn || ''}
              onChange={(e) => updateField('kilometersReturn', parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="toll-amount" className="text-sm font-medium">{t('tollAmountNok')}</Label>
          <Input
            id="toll-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={jobData.tollAmount || ''}
            onChange={(e) => updateField('tollAmount', parseFloat(e.target.value) || 0)}
            className="mt-1"
          />
        </div>

        {/* Day-based time entries */}
        <Separator />
        
        <div className="space-y-4">
          <h4 className="font-medium">{t('timeEntries')} ({jobData.plannedDays || 1} {t('days')})</h4>
          
          {Array.from({ length: jobData.plannedDays || 1 }, (_, index) => (
            <Card key={index} className="border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('day')} {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('travelStart')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder={t('date')}
                        className="text-xs"
                      />
                      <Input
                        type="time"
                        placeholder={t('time')}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('workStart')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder={t('date')}
                        className="text-xs"
                      />
                      <Input
                        type="time"
                        placeholder={t('time')}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('workEnd')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder={t('date')}
                        className="text-xs"
                      />
                      <Input
                        type="time"
                        placeholder={t('time')}
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('travelEnd')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder={t('date')}
                        className="text-xs"
                      />
                      <Input
                        type="time"
                        placeholder={t('time')}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Dynamic steps based on whether hotel data exists
  const hasHotel = Boolean(jobData.hotelName && jobData.hotelName.trim().length > 0);
  const allSteps = [
    { id: 'customer', label: t('customerData'), icon: User },
    { id: 'machine', label: t('machineData'), icon: Wrench },
    ...(hasHotel ? [{ id: 'hotel', label: t('hotelData'), icon: Hotel }] : []),
    { id: 'travel', label: t('travel'), icon: Car },
  ] as const;
  
  const steps = allSteps;

  // Auto-navigate to Hotel tab when a hotel name is entered
  useEffect(() => {
    const has = Boolean(jobData.hotelName && jobData.hotelName.trim().length > 0);
    console.info('UI: hasHotel changed', { hotelName: jobData.hotelName, has });
    if (isEditingJob && has && currentStep !== 'hotel') {
      setCurrentStep('hotel');
    }
  }, [jobData.hotelName, isEditingJob]);

  return (
    <div className="p-4 space-y-6">
      {/* Job Title with Customer Name */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isEditingJob ? t('editJob') : t('newJob')}
          {isPersisted && customerName && (
            <span data-testid="job-title-customer" className="ml-2 text-muted-foreground">— {customerName}</span>
          )}
        </h2>
        {isEditingJob && (
          <Badge variant="secondary" className="px-3 py-1">
            <Clock className="h-3 w-3 mr-1" />
            {t('jobEditing')}
          </Badge>
        )}
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
          const isAccessible = isEditingJob || step.id === 'customer'; // Make all tabs accessible when editing
          
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

      {/* Context Bar - Customer Info */}
      {isPersisted && customerName && (
        <div data-testid="job-context-bar" className="text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1">
            <span className="font-medium">Kunde:</span> {customerName}
          </span>
        </div>
      )}

      <Separator />

      {/* Current Step Content */}
      {currentStep === 'customer' && renderCustomerSection()}
      {currentStep === 'machine' && renderMachineSection()}
      {currentStep === 'hotel' && renderHotelSection()}
      {currentStep === 'travel' && renderTravelSection()}

      {/* Status Indicator */}
      {isEditingJob && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-sm text-blue-700">
            📝 {t('jobEditing')} • {t('jobIdShort')}: {currentJobId?.slice(0, 8)}... 
            {currentStep !== 'customer' && <span className="ml-2">{t('addMoreData')}</span>}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 gap-2">
        <div className="flex gap-2">
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
          
          {isEditingJob && (
            <Button
              variant="secondary"
              onClick={startNewJob}
              disabled={isLoading}
            >
              {t('newJob')}
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Save partial data button (only if editing and not on customer step) */}
          {isEditingJob && currentStep !== 'customer' && (
            <Button
              variant="outline"
              onClick={() => saveJobData(true)}
              disabled={isLoading}
            >
              {isLoading ? t('save') : t('save')}
            </Button>
          )}
          
          {/* Main action button */}
          <Button
            onClick={() => {
              if (currentStep === 'customer') {
                // Save customer data (partial save)
                saveJobData(true);
              } else {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id as any);
                } else if (currentStep === 'travel') {
                  // Complete the job
                  saveJobData(false);
                }
              }
            }}
            disabled={isLoading || (currentStep === 'customer' && !jobData.customerName)}
          >
            {isLoading ? t('save') : 
             currentStep === 'customer' ? t('saveCustomer') : 
             currentStep === 'travel' ? t('completeJob') : 
             t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
};