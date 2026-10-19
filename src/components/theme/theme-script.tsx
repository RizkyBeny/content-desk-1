const THEME_SCRIPT = `(function(){try{var k="theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var r=document.documentElement;r.classList.remove("light","dark");r.classList.add(t);r.style.colorScheme=t}catch(e){}})()`;

export function ThemeScript() {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
