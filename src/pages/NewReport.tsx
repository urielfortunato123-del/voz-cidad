import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, MapPin, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { FileUploader } from '@/components/FileUploader';
import { VoiceInput } from '@/components/VoiceInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, VALIDATION, type CategoryKey } from '@/lib/constants';
import { getSelectedLocation } from '@/lib/device';
import { useCreateReport, useUploadEvidence } from '@/hooks/useReports';
import { useOffline } from '@/contexts/OfflineContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  category: z.string().min(1, 'Selecione uma categoria'),
  title: z.string().max(80).optional(),
  description: z.string().min(1, 'Descrição é obrigatória').max(1000, 'Máximo 1000 caracteres'),
  occurred_at: z.date(),
  address_text: z.string().optional(),
  is_anonymous: z.boolean(),
  author_name: z.string().optional(),
  author_contact: z.string().optional(),
  show_name_publicly: z.boolean(),
  terms_accepted: z.boolean().refine(val => val === true, 'Você deve aceitar os termos'),
}).refine(data => {
  if (!data.is_anonymous && !data.author_name) {
    return false;
  }
  return true;
}, {
  message: 'Nome é obrigatório para denúncia identificada',
  path: ['author_name'],
});

type FormData = z.infer<typeof formSchema>;

export default function NewReport() {
  const navigate = useNavigate();
  const location = getSelectedLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const createReport = useCreateReport();
  const uploadEvidence = useUploadEvidence();
  const { isOnline, addPendingReport } = useOffline();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: '',
      title: '',
      description: '',
      occurred_at: new Date(),
      address_text: '',
      is_anonymous: true,
      author_name: '',
      author_contact: '',
      show_name_publicly: false,
      terms_accepted: false,
    },
  });
  
  const isAnonymous = watch('is_anonymous');
  const description = watch('description') || '';
  const occurredAt = watch('occurred_at');
  
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada');
      return;
    }
    
    setGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
        toast.success('Localização capturada!');
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Não foi possível obter a localização');
      }
    );
  };
  
  const onSubmit = async (data: FormData) => {
    if (!location) {
      navigate('/selecionar-local');
      return;
    }
    
    const reportData = {
      uf: location.uf,
      city: location.city,
      category: data.category as CategoryKey,
      title: data.title || null,
      description: data.description,
      occurred_at: format(data.occurred_at, 'yyyy-MM-dd'),
      address_text: data.address_text || null,
      lat: coords?.lat || null,
      lng: coords?.lng || null,
      is_anonymous: data.is_anonymous,
      author_name: data.author_name || null,
      author_contact: data.author_contact || null,
      show_name_publicly: data.show_name_publicly,
    };
    
    // If offline, save locally
    if (!isOnline) {
      try {
        const pendingReport = await addPendingReport(reportData, files);
        navigate(`/sucesso/${pendingReport.protocol}?offline=true`);
        return;
      } catch (error) {
        toast.error('Erro ao salvar denúncia localmente');
        console.error(error);
        return;
      }
    }
    
    // Online: send to server
    try {
      const report = await createReport.mutateAsync({
        ...reportData,
        title: reportData.title || undefined,
        address_text: reportData.address_text || undefined,
        lat: reportData.lat || undefined,
        lng: reportData.lng || undefined,
        author_name: reportData.author_name || undefined,
        author_contact: reportData.author_contact || undefined,
      });
      
      // Upload files
      for (const file of files) {
        try {
          await uploadEvidence.mutateAsync({ reportId: report.id, file });
        } catch (err) {
          console.error('Error uploading file:', err);
        }
      }
      
      toast.success('Denúncia registrada!');
      navigate(`/sucesso/${report.protocol}`);
    } catch (error) {
      // If online submission fails, save offline
      toast.warning('Falha na conexão. Salvando localmente...');
      try {
        const pendingReport = await addPendingReport(reportData, files);
        navigate(`/sucesso/${pendingReport.protocol}?offline=true`);
      } catch (offlineError) {
        toast.error('Erro ao salvar denúncia');
        console.error(offlineError);
      }
    }
  };
  
  if (!location) {
    navigate('/selecionar-local');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Nova Denúncia" showBack />
      
      <main className="page-container">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>Modo offline:</strong> Sua denúncia será salva e enviada quando a conexão for restabelecida.
            </p>
          </div>
        )}
        
        {/* Legal Warning */}
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-destructive text-sm">
                Atenção: Denúncias falsas são crime!
              </p>
              <p className="text-sm text-foreground/80">
                Denunciar falsamente funcionário público pode resultar em <strong>processo judicial e prisão</strong> (Art. 339 do Código Penal). 
                Relate apenas fatos verídicos que você presenciou. A internet não é terra sem lei.
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <Label className="form-label">Categoria *</Label>
            <Select onValueChange={(v) => setValue('category', v)}>
              <SelectTrigger className="input-accessible">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORIES).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>
          
          {/* Title */}
          <div className="space-y-2">
            <Label className="form-label">Título (opcional)</Label>
            <Input
              {...register('title')}
              placeholder="Ex: Buraco na rua principal"
              className="input-accessible"
              maxLength={80}
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="form-label">Descrição *</Label>
              <VoiceInput 
                onTranscript={(text) => {
                  const current = watch('description') || '';
                  setValue('description', current + (current ? ' ' : '') + text);
                }}
                className="h-9 w-9"
              />
            </div>
            <Textarea
              {...register('description')}
              placeholder="Descreva o problema com detalhes... (ou use o microfone)"
              className="min-h-[150px] text-base"
              maxLength={1000}
            />
            <div className="flex justify-between text-sm">
              {errors.description ? (
                <p className="text-destructive">{errors.description.message}</p>
              ) : (
                <span className="text-xs text-muted-foreground">💡 Toque no microfone para ditar</span>
              )}
              <span className={cn(
                'text-muted-foreground',
                description.length > 900 && 'text-warning',
                description.length >= 1000 && 'text-destructive'
              )}>
                {description.length}/{VALIDATION.DESCRIPTION_MAX}
              </span>
            </div>
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label className="form-label">Data do ocorrido *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full input-accessible justify-start text-left font-normal',
                    !occurredAt && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {occurredAt ? format(occurredAt, 'dd/MM/yyyy') : 'Selecione a data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={occurredAt}
                  onSelect={(date) => date && setValue('occurred_at', date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Location */}
          <div className="space-y-3">
            <Label className="form-label">Local do fato</Label>
            <Button
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="w-full btn-touch"
            >
              {gettingLocation ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-5 w-5" />
              )}
              {coords ? 'Localização capturada ✓' : 'Usar minha localização'}
            </Button>
            <Input
              {...register('address_text')}
              placeholder="Ou digite o endereço aproximado"
              className="input-accessible"
            />
          </div>
          
          {/* Files */}
          <div className="space-y-2">
            <Label className="form-label">Evidências</Label>
            <FileUploader files={files} onChange={setFiles} />
          </div>
          
          {/* Identification */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <Label className="form-label">Identificação</Label>
            <RadioGroup
              defaultValue="anonymous"
              onValueChange={(v) => setValue('is_anonymous', v === 'anonymous')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="anonymous" id="anonymous" />
                <Label htmlFor="anonymous" className="font-normal cursor-pointer">
                  Anônimo
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="identified" id="identified" />
                <Label htmlFor="identified" className="font-normal cursor-pointer">
                  Identificado
                </Label>
              </div>
            </RadioGroup>
            
            {!isAnonymous && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="form-label">Nome *</Label>
                  <Input
                    {...register('author_name')}
                    placeholder="Seu nome completo"
                    className="input-accessible"
                  />
                  {errors.author_name && (
                    <p className="text-sm text-destructive">{errors.author_name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="form-label">Contato (opcional)</Label>
                  <Input
                    {...register('author_contact')}
                    placeholder="E-mail ou telefone"
                    className="input-accessible"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-name" className="text-sm cursor-pointer">
                    Exibir meu nome publicamente
                  </Label>
                  <Switch
                    id="show-name"
                    onCheckedChange={(checked) => setValue('show_name_publicly', checked)}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Terms */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                onCheckedChange={(checked) => setValue('terms_accepted', checked === true)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                <strong>Declaro sob as penas da lei</strong> que estou relatando fatos verídicos que presenciei. 
                Não irei expor dados pessoais de terceiros. Estou ciente de que denúncias falsas 
                constituem crime e podem resultar em processo criminal.
              </Label>
            </div>
            {errors.terms_accepted && (
              <p className="text-sm text-destructive">{errors.terms_accepted.message}</p>
            )}
          </div>
          
          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full btn-touch text-lg"
            size="lg"
            disabled={isSubmitting || createReport.isPending}
          >
            {(isSubmitting || createReport.isPending) ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isOnline ? 'Enviando...' : 'Salvando...'}
              </>
            ) : isOnline ? (
              'Enviar Denúncia'
            ) : (
              <>
                <WifiOff className="mr-2 h-5 w-5" />
                Salvar Offline
              </>
            )}
          </Button>
        </form>
      </main>
      
      <BottomNav />
    </div>
  );
}
