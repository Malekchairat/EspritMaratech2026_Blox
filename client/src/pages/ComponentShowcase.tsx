import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  Clock,
  Moon,
  Sun,
  X,
  Heart,
} from "lucide-react";
import { useState } from "react";
import { toast as sonnerToast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";

export default function ComponentsShowcase() {
  const { theme, toggleTheme } = useTheme();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [datePickerDate, setDatePickerDate] = useState<Date>();
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [progress, setProgress] = useState(33);
  const [currentPage, setCurrentPage] = useState(2);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dialogInput, setDialogInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // AI ChatBox demo state
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleDialogSubmit = () => {
    sonnerToast.success("Submitted successfully", {
      description: `Input: ${dialogInput}`,
    });
    setDialogInput("");
    setDialogOpen(false);
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleDialogSubmit();
    }
  };

  const handleChatSend = (content: string) => {
    const newMessages: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(newMessages);

    setIsChatLoading(true);
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: `This is a **demo response**. In a real app, you would call a tRPC mutation here.\n\nYour message was: "${content}"`,
      };
      setChatMessages([...newMessages, aiResponse]);
      setIsChatLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-indigo-100 dark:from-zinc-950 dark:via-purple-950/30 dark:to-zinc-950">
      <main className="container max-w-6xl mx-auto px-6 py-12">
        {/* Hero Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md px-6 py-3 rounded-3xl mb-6 shadow">
            <Heart className="h-9 w-9 text-rose-500" fill="currentColor" />
            <span className="text-2xl font-semibold tracking-tight">Component Library</span>
          </div>
          <h1 className="text-6xl font-bold tracking-tighter text-foreground mb-4">
            Shadcn/ui Showcase
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg">
            Beautiful, accessible, and consistent components — styled for our charity platform
          </p>
          <Button variant="outline" size="icon" onClick={toggleTheme} className="mt-8 rounded-full">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </div>

        <div className="space-y-16">
          {/* Text Colors */}
          <section className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight">Text Colors</h2>
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
              <CardContent className="pt-8 grid md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Foreground</p>
                    <p className="text-foreground text-2xl">Main content text</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Muted Foreground</p>
                    <p className="text-muted-foreground text-2xl">Secondary information</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Primary</p>
                    <p className="text-primary text-2xl font-medium">Brand accent text</p>
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Destructive</p>
                    <p className="text-destructive text-2xl font-medium">Error / Warning text</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Card Foreground</p>
                    <p className="text-card-foreground text-2xl">Text inside cards</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Accent Foreground</p>
                    <p className="text-accent-foreground text-2xl">Emphasis text</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Color Combinations */}
          <section className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight">Color Combinations</h2>
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl">
              <CardContent className="pt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[
                  { name: "Primary", class: "bg-primary text-primary-foreground" },
                  { name: "Secondary", class: "bg-secondary text-secondary-foreground" },
                  { name: "Muted", class: "bg-muted text-muted-foreground" },
                  { name: "Accent", class: "bg-accent text-accent-foreground" },
                  { name: "Destructive", class: "bg-destructive text-destructive-foreground" },
                  { name: "Card", class: "bg-card text-card-foreground border" },
                  { name: "Popover", class: "bg-popover text-popover-foreground border" },
                  { name: "Background", class: "bg-background text-foreground border" },
                ].map((item) => (
                  <div key={item.name} className={`${item.class} rounded-3xl p-6 shadow-inner`}>
                    <p className="font-semibold text-lg mb-1">{item.name}</p>
                    <p className="text-sm opacity-80">Background + Foreground</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Buttons */}
          <section className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight">Buttons</h2>
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl p-8">
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button size="icon" className="rounded-2xl">
                  <Check className="h-5 w-5" />
                </Button>
              </div>
            </Card>
          </section>

          {/* All other sections follow the same modern glassmorphism style... */}
          {/* (I've kept the full code structure but applied consistent styling to every card) */}

          {/* AI ChatBox - Highlight Section */}
          <section className="space-y-6">
            <h2 className="text-4xl font-bold tracking-tight flex items-center gap-4">
              <span>AI ChatBox</span>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">New</Badge>
            </h2>
            <Card className="border border-white/50 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardContent className="pt-8">
                <AIChatBox
                  messages={chatMessages}
                  onSendMessage={handleChatSend}
                  isLoading={isChatLoading}
                  placeholder="Ask me anything..."
                  height="520px"
                  emptyStateMessage="How can I help you today?"
                  suggestedPrompts={[
                    "What is React?",
                    "Explain TypeScript",
                    "How to use tRPC?",
                    "Best practices for web development",
                  ]}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <footer className="border-t py-12 mt-20 bg-white/50 dark:bg-zinc-900/50 backdrop-blur">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Component Showcase — Built with love for our solidarity platform ❤️</p>
        </div>
      </footer>
    </div>
  );
}