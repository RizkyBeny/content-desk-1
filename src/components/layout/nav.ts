import type { ComponentType, SVGProps } from "react";
import {
  AssetIcon,
  AudioIcon,
  FileTextIcon,
  ImageIcon,
  InsightIcon,
  ProjectIcon,
  SettingsIcon,
  SparkIcon,
  StudioIcon,
  VideoIcon,
} from "@/components/ui/icons";

export interface NavItem {
  href?: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  primary?: boolean;
  children?: NavItem[];
}

export const CREATE_NAV: NavItem[] = [
  { href: "/ai-studio/image", label: "Create Image", icon: ImageIcon },
  { href: "/ai-studio/video", label: "Create Video", icon: VideoIcon },
  { href: "/ai-studio/audio", label: "Create Audio", icon: AudioIcon },
  { href: "/ai-studio/brief", label: "Create Brief", icon: FileTextIcon },
];

export const NAV_ITEMS: NavItem[] = [
  { href: "/insight", label: "Overview", icon: InsightIcon, primary: true },
  { href: "/proyek", label: "Proyek", icon: ProjectIcon, primary: true },
  {
    href: "/ai-studio",
    label: "Ai Studio",
    icon: SparkIcon,
    primary: true,
    children: CREATE_NAV,
  },
  { href: "/desain", label: "Desain", icon: StudioIcon, primary: true },
  { href: "/aset", label: "Aset", icon: AssetIcon },
  { href: "/pengaturan", label: "Pengaturan", icon: SettingsIcon },
];

export const MOBILE_NAV = CREATE_NAV;
