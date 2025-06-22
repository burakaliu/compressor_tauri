import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { ArrowLeft, Settings as SettingsIcon, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define the settings interface to match the Rust enum
interface AppSettings {
  compression_quality: number;
  method: "lossy" | "lossless" | "webp_lossy" | "webp_lossless";
}

const defaultSettings: AppSettings = {
  compression_quality: 75,
  method: "webp_lossy",
};

interface SettingsPageProps {
  onBackToMain: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBackToMain }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    invoke<AppSettings>("load_settings")
      .then((loadedSettings) => setSettings(loadedSettings))
      .catch(() => setSettings(defaultSettings));
  }, []);

  const save = () => {
    invoke("save_settings", { settings }).then(() => {
      toast("Settings saved", {
        description: "Your settings were saved successfully.",
      });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={onBackToMain}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Compression Settings
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quality" className="text-base font-medium">
                    Compression Quality
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      id="quality"
                      defaultValue={[settings.compression_quality]}
                      max={100}
                      min={10}
                      step={1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                      value={[settings.compression_quality]}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          compression_quality: value[0],
                        })
                      }
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Lower quality (smaller files)</span>
                      <span className="font-medium">
                        {settings.compression_quality}%
                      </span>
                      <span>Higher quality (larger files)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method" className="text-base font-medium">
                    Compression Method
                  </Label>
                  <select
                    id="method"
                    value={settings.method}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        method: e.target.value as AppSettings["method"],
                      })
                    }
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="lossy">Lossy (JPEG)</option>
                    <option value="lossless">Lossless (PNG)</option>
                    <option value="webp_lossy">WebP Lossy (recommended)</option>
                    <option value="webp_lossless">WebP Lossless</option>
                  </select>
                </div>

                <Button onClick={save} className="w-full">
                  Save Settings
                </Button>
              </div>
            </Card>
          </div>

          {/* Information Panel */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">About Compression</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-foreground">Quality:</strong>
                    <p className="text-muted-foreground">
                      Controls the balance between file size and image quality
                      (applies to lossy methods)
                    </p>
                  </div>
                  <div>
                    <strong className="text-foreground">Lossy (JPEG):</strong>
                    <p className="text-muted-foreground">
                      Smaller file sizes with some quality loss. Best for
                      photos.
                    </p>
                  </div>
                  <div>
                    <strong className="text-foreground">Lossless (PNG):</strong>
                    <p className="text-muted-foreground">
                      No quality loss. Best for graphics and transparency, but
                      larger files.
                    </p>
                  </div>
                  <div>
                    <strong className="text-foreground">WebP Lossy:</strong>
                    <p className="text-muted-foreground">
                      Modern format with better compression than JPEG. Supports
                      transparency.
                    </p>
                  </div>
                  <div>
                    <strong className="text-foreground">WebP Lossless:</strong>
                    <p className="text-muted-foreground">
                      Modern format with better compression than PNG but larger
                      than lossy WebP.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
