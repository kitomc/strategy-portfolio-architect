import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioStore } from '@/store/portfolioStore';
import { parseMultipleFiles, ParseError } from '@/utils/parser';
import { Upload, FileIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploadState {
  uploading: boolean;
  progress: number;
  error?: string;
}

export function FileUpload() {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    uploading: false,
    progress: 0
  });
  
  const { toast } = useToast();
  const addUploadedFile = usePortfolioStore(state => state.addUploadedFile);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploadState({ uploading: true, progress: 0 });

    try {
      // Parse files with progress updates
      const totalFiles = acceptedFiles.length;
      const parsedFiles = [];

      for (let i = 0; i < totalFiles; i++) {
        const file = acceptedFiles[i];
        setUploadState({
          uploading: true,
          progress: Math.round((i / totalFiles) * 80) // Reserve last 20% for processing
        });

        try {
          const parsed = await parseMultipleFiles([file]);
          parsedFiles.push(...parsed);
        } catch (error) {
          console.warn(`Failed to parse ${file.name}:`, error);
          toast({
            title: "Parse Warning",
            description: `Could not parse ${file.name}. Skipping...`,
            variant: "destructive",
          });
        }
      }

      setUploadState({ uploading: true, progress: 90 });

      // Add parsed files to store
      let totalStrategies = 0;
      parsedFiles.forEach(file => {
        addUploadedFile(file);
        totalStrategies += file.strategies.length;
      });

      setUploadState({ uploading: true, progress: 100 });

      toast({
        title: "Upload Successful!",
        description: `Loaded ${totalStrategies} strategies from ${parsedFiles.length} files.`,
      });

      // Reset state after a brief delay
      setTimeout(() => {
        setUploadState({ uploading: false, progress: 0 });
      }, 1000);

    } catch (error) {
      const message = error instanceof ParseError ? error.message : 'Unexpected error during upload';
      
      setUploadState({ 
        uploading: false, 
        progress: 0, 
        error: message 
      });

      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [addUploadedFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: true,
    disabled: uploadState.uploading
  });

  return (
    <Card className="bg-gradient-background shadow-card hover:shadow-elevated transition-all duration-200">
      <CardContent className="p-8">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragActive 
              ? 'border-primary bg-primary/5 shadow-glow' 
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }
            ${uploadState.uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4">
            {uploadState.uploading ? (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div className="space-y-2 w-full max-w-xs">
                  <Progress value={uploadState.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Processing files... {uploadState.progress}%
                  </p>
                </div>
              </>
            ) : uploadState.error ? (
              <>
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Upload Failed</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {uploadState.error}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadState({ uploading: false, progress: 0 })}
                  >
                    Try Again
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload Strategy Files</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Drop your EA Studio JSON files here or click to browse
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileIcon className="w-3 h-3" />
                    Supports .json files up to 50MB each
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Choose Files
                </Button>
              </>
            )}
          </div>
        </div>

        {uploadState.progress === 100 && !uploadState.error && (
          <div className="mt-4 p-3 rounded-lg bg-profit/10 border border-profit/20 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-profit" />
            <span className="text-sm text-profit-foreground font-medium">
              Files uploaded successfully!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}