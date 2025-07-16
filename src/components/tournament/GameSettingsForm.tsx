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
  room_type: z.enum(["Classic", "Clash Squad", "Lone Wolf"]),
  custom_settings: z.object({
    gun_attributes: z.boolean().optional(),
    character_skill: z.boolean().optional(),
    auto_revival: z.boolean().optional(),
    airdrop: z.boolean().optional(),
    vehicles: z.boolean().optional(),
    high_tier_loot_zone: z.boolean().optional(),
    unlimited_ammo: z.boolean().optional(),
    headshot: z.boolean().optional(),
    war_chest: z.boolean().optional(),
    loadout: z.boolean().optional(),
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
        gun_attributes: formData.custom_settings.gun_attributes || false,
        character_skill: formData.custom_settings.character_skill || false,
        auto_revival: formData.custom_settings.auto_revival || false,
        airdrop: formData.custom_settings.airdrop || false,
        vehicles: formData.custom_settings.vehicles || false,
        high_tier_loot_zone: formData.custom_settings.high_tier_loot_zone || false,
        unlimited_ammo: formData.custom_settings.unlimited_ammo || false,
        headshot: formData.custom_settings.headshot || false,
        war_chest: formData.custom_settings.war_chest || false,
        loadout: formData.custom_settings.loadout || false,
      },
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
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
                      <SelectItem value="Lone Wolf">Lone Wolf</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-6 text-center text-gaming-primary">Custom Room Settings</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="custom_settings.gun_attributes"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Gun Attributes</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable special gun attributes
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.character_skill"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Character Skill</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Allow use of character skills
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.auto_revival"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Auto Revival</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable auto revival for players
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.airdrop"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Airdrop</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable airdrops during the match
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.vehicles"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Vehicles</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Allow use of vehicles
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.high_tier_loot_zone"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">High Tier Loot Zone</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable high tier loot zones
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.unlimited_ammo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Unlimited Ammo</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable unlimited ammo for all weapons
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.headshot"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Headshot</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable headshot only mode
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.war_chest"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">War Chest</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Enable war chests on the map
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="custom_settings.loadout"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg bg-gaming-bg/50 border border-gaming-border hover:border-gaming-primary/40 transition-all duration-300 hover:bg-gaming-bg/70 toggle-card">
                      <div className="flex-1">
                        <FormLabel className="text-base font-medium text-white cursor-pointer">Loadout</FormLabel>
                        <FormDescription className="text-sm text-gray-400 mt-1">
                          Allow players to use their loadout
                        </FormDescription>
                      </div>
                      <FormControl>
                        <div className="ml-4">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="switch-glow"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
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
              className="bg-gaming-primary hover:bg-gaming-primary/90 w-full sm:w-auto order-1 sm:order-2 py-6 sm:py-2 rounded-xl sm:rounded-md text-base font-medium"
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