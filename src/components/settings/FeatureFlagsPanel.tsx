import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Flag, 
  RefreshCw, 
  RotateCcw, 
  Info, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getAllFlags,
  getFlagMeta,
  getFlagSource,
  setLocalOverride,
  clearLocalOverride,
  clearAllLocalOverrides,
  subscribe,
  type FlagKey,
  type FlagValue,
  FLAG_REGISTRY
} from '@/flags/flags';
import { 
  fetchRemoteConfig, 
  formatLastFetchTime,
  isStale 
} from '@/flags/remoteConfig';

interface FlagRowData {
  key: FlagKey;
  value: FlagValue;
  defaultValue: FlagValue;
  source: 'default' | 'remote' | 'local';
  description: string;
  type: 'boolean' | 'number' | 'string';
}

export const FeatureFlagsPanel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [flags, setFlags] = useState<Record<FlagKey, FlagValue>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<string>('');
  const [configStale, setConfigStale] = useState(false);
  
  // Load initial flags and setup subscription
  useEffect(() => {
    const updateFlags = () => {
      setFlags(getAllFlags());
      setLastFetch(formatLastFetchTime());
      setConfigStale(isStale());
    };
    
    updateFlags();
    const unsubscribe = subscribe(updateFlags);
    
    return unsubscribe;
  }, []);
  
  // Prepare flag data for table
  const flagRows: FlagRowData[] = Object.keys(FLAG_REGISTRY).map(key => {
    const flagMeta = getFlagMeta(key)!;
    const currentValue = flags[key] ?? flagMeta.default;
    const source = getFlagSource(key);
    
    return {
      key,
      value: currentValue,
      defaultValue: flagMeta.default,
      source,
      description: flagMeta.description,
      type: typeof flagMeta.default as 'boolean' | 'number' | 'string'
    };
  });
  
  const handleBooleanToggle = (key: FlagKey, checked: boolean) => {
    const flagMeta = getFlagMeta(key);
    if (!flagMeta) return;
    
    if (checked === flagMeta.default) {
      // If setting back to default, clear override
      clearLocalOverride(key);
    } else {
      // Set local override
      setLocalOverride(key, checked);
    }
  };
  
  const handleValueChange = (key: FlagKey, value: string) => {
    const flagMeta = getFlagMeta(key);
    if (!flagMeta) return;
    
    let parsedValue: FlagValue;
    
    try {
      if (typeof flagMeta.default === 'number') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) return;
      } else {
        parsedValue = value;
      }
      
      if (parsedValue === flagMeta.default) {
        clearLocalOverride(key);
      } else {
        setLocalOverride(key, parsedValue);
      }
    } catch (error) {
      toast({
        title: t('flags.error'),
        description: t('flags.invalidValue'),
        variant: 'destructive',
      });
    }
  };
  
  const handleResetToDefaults = () => {
    clearAllLocalOverrides();
    toast({
      title: t('flags.resetSuccess'),
      description: t('flags.resetSuccessDescription'),
    });
  };
  
  const handleRefreshFromServer = async () => {
    setIsRefreshing(true);
    
    try {
      const success = await fetchRemoteConfig();
      
      if (success) {
        toast({
          title: t('flags.refreshSuccess'),
          description: t('flags.refreshSuccessDescription'),
        });
      } else {
        toast({
          title: t('flags.refreshFailed'),
          description: t('flags.refreshFailedDescription'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: t('flags.refreshError'),
        description: error instanceof Error ? error.message : t('flags.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const getSourceBadge = (source: 'default' | 'remote' | 'local') => {
    switch (source) {
      case 'local':
        return <Badge variant="default">{t('flags.sourceLocal')}</Badge>;
      case 'remote':
        return <Badge variant="secondary">{t('flags.sourceRemote')}</Badge>;
      case 'default':
        return <Badge variant="outline">{t('flags.sourceDefault')}</Badge>;
    }
  };
  
  const renderValueControl = (row: FlagRowData) => {
    if (row.type === 'boolean') {
      return (
        <Switch
          checked={row.value as boolean}
          onCheckedChange={(checked) => handleBooleanToggle(row.key, checked)}
        />
      );
    }
    
    return (
      <Input
        type={row.type === 'number' ? 'number' : 'text'}
        value={String(row.value)}
        onChange={(e) => handleValueChange(row.key, e.target.value)}
        className="w-32"
      />
    );
  };
  
  const configUrl = import.meta.env.VITE_CONFIG_URL;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            {t('flags.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Remote Config Status */}
          {configUrl && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('flags.remoteConfigEnabled')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('flags.lastFetch')}: {lastFetch}
                    {configStale && (
                      <span className="ml-2 text-orange-600">
                        ({t('flags.stale')})
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleRefreshFromServer}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t('flags.refreshFromServer')}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {!configUrl && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {t('flags.remoteConfigDisabled')}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleResetToDefaults}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('flags.resetToDefaults')}
            </Button>
          </div>
          
          {/* Flags Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('flags.flagName')}</TableHead>
                  <TableHead>{t('flags.currentValue')}</TableHead>
                  <TableHead>{t('flags.defaultValue')}</TableHead>
                  <TableHead>{t('flags.source')}</TableHead>
                  <TableHead>{t('flags.description')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-mono text-sm">
                      {row.key}
                    </TableCell>
                    <TableCell>
                      {renderValueControl(row)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {String(row.defaultValue)}
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(row.source)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-64">
                      {row.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};