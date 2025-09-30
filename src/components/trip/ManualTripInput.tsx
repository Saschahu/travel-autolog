import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { TripInput, VehicleType, VehicleSize } from '@/types/trip';
import { MapPin, Calendar, Clock, Car } from 'lucide-react';

interface ManualTripInputProps {
  onCalculate?: (input: TripInput) => void;
  onSaveDraft?: (input: TripInput) => void;
}

export function ManualTripInput({ onCalculate, onSaveDraft }: ManualTripInputProps) {
  const { t } = useTranslation('trip');
  
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [dateYmd, setDateYmd] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeHm, setTimeHm] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [vehicleType, setVehicleType] = useState<VehicleType>('benzin');
  const [vehicleSize, setVehicleSize] = useState<VehicleSize>(1);
  const [vehicleLength, setVehicleLength] = useState('');

  const validateInput = useCallback((): boolean => {
    if (!fromAddress.trim()) {
      toast({
        variant: 'destructive',
        title: t('validation.startRequired'),
        description: t('validation.startRequiredDesc')
      });
      return false;
    }
    if (!toAddress.trim()) {
      toast({
        variant: 'destructive',
        title: t('validation.targetRequired'),
        description: t('validation.targetRequiredDesc')
      });
      return false;
    }
    return true;
  }, [fromAddress, toAddress, t]);

  const getTripInput = useCallback((): TripInput => ({
    fromAddress: fromAddress.trim(),
    toAddress: toAddress.trim(),
    dateYmd,
    timeHm,
    vehicle: {
      type: vehicleType,
      size: vehicleSize,
      length: vehicleLength || undefined
    }
  }), [fromAddress, toAddress, dateYmd, timeHm, vehicleType, vehicleSize, vehicleLength]);

  const handleCalculate = () => {
    if (!validateInput()) return;
    const input = getTripInput();
    onCalculate?.(input);
    toast({
      title: t('calculating'),
      description: t('calculatingDesc')
    });
  };

  const handleSaveDraft = () => {
    if (!validateInput()) return;
    const input = getTripInput();
    onSaveDraft?.(input);
    toast({
      title: t('draftSaved'),
      description: t('draftSavedDesc')
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t('manualInput')}
        </CardTitle>
        <CardDescription>{t('manualInputDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Start Address */}
        <div className="space-y-2">
          <Label htmlFor="from-address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('startAddress')}
          </Label>
          <Input
            id="from-address"
            placeholder={t('startAddressPlaceholder')}
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
          />
        </div>

        {/* Target Address */}
        <div className="space-y-2">
          <Label htmlFor="to-address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('targetAddress')}
          </Label>
          <Input
            id="to-address"
            placeholder={t('targetAddressPlaceholder')}
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('date')}
            </Label>
            <Input
              id="date"
              type="date"
              value={dateYmd}
              onChange={(e) => setDateYmd(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('time')}
            </Label>
            <Input
              id="time"
              type="time"
              value={timeHm}
              onChange={(e) => setTimeHm(e.target.value)}
            />
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="space-y-2">
          <Label htmlFor="vehicle-type" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            {t('vehicleType')}
          </Label>
          <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as VehicleType)}>
            <SelectTrigger id="vehicle-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="benzin">{t('vehicleBenzin')}</SelectItem>
              <SelectItem value="diesel">{t('vehicleDiesel')}</SelectItem>
              <SelectItem value="ev">{t('vehicleEv')}</SelectItem>
              <SelectItem value="phev">{t('vehiclePhev')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Size */}
        <div className="space-y-2">
          <Label htmlFor="vehicle-size">{t('vehicleSize')}</Label>
          <Select value={String(vehicleSize)} onValueChange={(v) => setVehicleSize(Number(v) as VehicleSize)}>
            <SelectTrigger id="vehicle-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('vehicleSize1')}</SelectItem>
              <SelectItem value="2">{t('vehicleSize2')}</SelectItem>
              <SelectItem value="3">{t('vehicleSize3')}</SelectItem>
              <SelectItem value="4">{t('vehicleSize4')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Optional Length */}
        <div className="space-y-2">
          <Label htmlFor="vehicle-length">{t('vehicleLength')} ({t('optional')})</Label>
          <Input
            id="vehicle-length"
            type="number"
            placeholder="6.0"
            value={vehicleLength}
            onChange={(e) => setVehicleLength(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleCalculate} className="flex-1">
            {t('calculateRoute')}
          </Button>
          <Button onClick={handleSaveDraft} variant="outline" className="flex-1">
            {t('saveDraft')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
