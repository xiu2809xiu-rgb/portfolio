import { cn } from "@/lib/utils";

type Integration = {
	src: string;
	alt: string;
	isInvertable?: boolean;
};

const leftIntegrations: Integration[] = [
	{
		src: "https://storage.efferd.com/logo/vercel.svg",
		alt: "Vercel",
		isInvertable: true,
	},
	{
		src: "https://storage.efferd.com/logo/openai.svg",
		alt: "OpenAI",
		isInvertable: true,
	},
	{
		src: "https://storage.efferd.com/logo/supabase.svg",
		alt: "Supabase",
	},
	{
		src: "https://storage.efferd.com/logo/github.svg",
		alt: "GitHub",
		isInvertable: true,
	},
];

const rightIntegrations: Integration[] = [
	{
		src: "https://storage.efferd.com/logo/google-maps.svg",
		alt: "Google Maps Logo",
	},
	{
		src: "https://storage.efferd.com/logo/notion.svg",
		alt: "Notion Logo",
	},
	{
		src: "https://storage.efferd.com/logo/gmail.svg",
		alt: "Gmail Logo",
	},
	{
		src: "https://storage.efferd.com/logo/polar.svg",
		alt: "Polar Logo",
	},
];

export function Integrations() {
	return (
		<div className="mx-auto max-w-6xl">
			<div className="relative grid w-full grid-cols-1 border-y-2 px-4 md:grid-cols-3 md:gap-4">
				<IntegrationColumn
					className="justify-start"
					integrations={leftIntegrations}
					position="left"
				/>
				<div className="flex flex-col items-center justify-center gap-2 px-6 text-center">
					<h2 className="font-medium text-foreground text-xl tracking-tight sm:text-2xl md:text-3xl">
						Connect with your favorite tools
					</h2>
					<p className="text-muted-foreground text-xs md:text-sm">
						Connect your favorite tools with our growing library of
						integrations.
					</p>
				</div>
				<IntegrationColumn
					className="justify-end"
					integrations={rightIntegrations}
					position="right"
				/>
			</div>
		</div>
	);
}

type IntegrationColumnProps = React.ComponentProps<"div"> & {
	integrations: Integration[];
	position: "left" | "right";
};

function IntegrationColumn({
	integrations,
	position,
	className,
	...props
}: IntegrationColumnProps) {
	return (
		<div className={cn("flex h-50 gap-2 md:h-60", className)} {...props}>
			{integrations.map((integration) => (
				<div
					className="relative flex h-full flex-col items-center justify-center"
					key={integration.alt}
				>
					{/* Connector */}
					{position === "left" ? (
						<div className="absolute top-0 left-0 h-14 w-1/2 rounded-t-2xl border-r-2 md:h-18">
							<div className="absolute -right-[5px] -bottom-2 size-2 rounded-full bg-border shadow-xs" />
						</div>
					) : (
						<div className="absolute right-0 bottom-0 h-14 w-1/2 rounded-b-2xl border-l-2 md:h-18">
							<div className="absolute -top-2 -left-[5px] size-2 rounded-full bg-border shadow-xs" />
						</div>
					)}
					{/* Card */}
					<IntegrationCard integration={integration} />
				</div>
			))}
		</div>
	);
}

function IntegrationCard({
	integration,
	className,
	...props
}: React.ComponentProps<"div"> & {
	integration: Integration;
}) {
	return (
		<div
			className={cn(
				"flex aspect-square size-16 items-center justify-center rounded-2xl border bg-card shadow-xs lg:size-18 dark:bg-card",
				className
			)}
			{...props}
		>
			<img
				alt={integration.alt}
				className={cn(
					"pointer-events-none size-8 select-none object-contain",
					integration.isInvertable && "dark:invert"
				)}
				height={48}
				src={integration.src}
				width={48}
			/>
		</div>
	);
}
