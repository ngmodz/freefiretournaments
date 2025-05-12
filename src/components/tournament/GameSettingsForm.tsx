import { 
  Form,
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";

// Validation schema
const formSchema = z.object({
  map: z.string().min(1, "Map is required"),
  room_type: z.enum(["Classic", "Clash Squad"]),
  custom_settings: z.object({
    auto_aim: z.boolean(),
    fall_damage: z.boolean().optional(),
    friendly_fire: z.boolean().optional(),
  }),
});

interface GameSettingsFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const GameSettingsForm = ({ formData, updateFormData, nextStep, prevStep }: GameSettingsFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      map: formData.map,
      room_type: formData.room_type,
      custom_settings: {
        auto_aim: formData.custom_settings.auto_aim,
        fall_damage: formData.custom_settings.fall_damage || false,
        friendly_fire: formData.custom_settings.friendly_fire || false,
      },
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Ensure auto_aim is explicitly included to match TournamentFormData type
    const formattedValues = {
      ...values,
      custom_settings: {
        ...values.custom_settings,
        auto_aim: values.custom_settings.auto_aim,
      }
    };
    updateFormData(formattedValues);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Free Fire Game Settings</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="map"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Map</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gaming-card text-white">
                        <SelectValue placeholder="Select map" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gaming-card text-white">
                      <SelectItem value="Bermuda">Bermuda</SelectItem>
                      <SelectItem value="Kalahari">Kalahari</SelectItem>
                      <SelectItem value="Purgatory">Purgatory</SelectItem>
                      <SelectItem value="Alpine">Alpine</SelectItem>
                      <SelectItem value="Nexterra">Nexterra</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="room_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gaming-card text-white">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gaming-card text-white">
                      <SelectItem value="Classic">Classic</SelectItem>
                      <SelectItem value="Clash Squad">Clash Squad</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-gaming-card p-6 rounded-md">
            <h3 className="text-lg font-semibold mb-5 text-center">Custom Room Settings</h3>
            
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="custom_settings.auto_aim"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between py-2 border-b border-gaming-border">
                    <div>
                      <FormLabel className="text-base font-medium">Auto-Aim</FormLabel>
                      <FormDescription className="text-sm text-gaming-muted">
                        Allow auto-aim assistance in tournament matches
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-gaming-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="custom_settings.fall_damage"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between py-2 border-b border-gaming-border">
                    <div>
                      <FormLabel className="text-base font-medium">Fall Damage</FormLabel>
                      <FormDescription className="text-sm text-gaming-muted">
                        Enable damage from falling
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-gaming-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="custom_settings.friendly_fire"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between py-2">
                    <div>
                      <FormLabel className="text-base font-medium">Friendly Fire</FormLabel>
                      <FormDescription className="text-sm text-gaming-muted">
                        Allow damage to teammates
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-gaming-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              className="border-gaming-primary text-gaming-primary w-full sm:w-auto order-2 sm:order-1 py-6 sm:py-2 rounded-xl sm:rounded-md text-base"
            >
              <ChevronLeft size={18} className="mr-2" /> Previous
            </Button>
            <Button 
              type="submit" 
              className="bg-gaming-primary hover:bg-gaming-primary-dark w-full sm:w-auto order-1 sm:order-2 py-6 sm:py-2 rounded-xl sm:rounded-md text-base font-medium"
            >
              Next <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default GameSettingsForm; 