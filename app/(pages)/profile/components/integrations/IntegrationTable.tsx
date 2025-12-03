"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { AuthConfig } from "../../hooks/useIntegrations";

type IntegrationTableProps = {
  authConfigs: AuthConfig[];
  onAddConnection: () => void;
  onConnect?: (authConfigId: string) => void;
  onViewDetails?: (config: AuthConfig) => void;
};

/**
 * Gets status badge styling
 */
function getStatusBadge(config: AuthConfig) {
  if (!config.isConnected) {
    return { label: "Not Connected", className: "bg-slate-100 text-slate-600" };
  }
  
  const status = config.connectionStatus?.toUpperCase();
  switch (status) {
    case "ACTIVE":
    case "CONNECTED":
      return { label: "Connected", className: "bg-green-100 text-green-800" };
    case "PENDING":
      return { label: "Pending", className: "bg-yellow-100 text-yellow-800" };
    case "EXPIRED":
      return { label: "Expired", className: "bg-red-100 text-red-800" };
    case "FAILED":
      return { label: "Failed", className: "bg-red-100 text-red-800" };
    default:
      return { label: "Unknown", className: "bg-slate-100 text-slate-600" };
  }
}

/**
 * Empty state component
 */
function EmptyState({ onAddConnection }: { onAddConnection: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No integrations available</h3>
      <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">
        Configure auth configs in your Composio dashboard to see available integrations.
      </p>
      <Button onClick={onAddConnection}>Add Connection</Button>
    </div>
  );
}

/**
 * IntegrationTable - displays available auth configs
 */
export function IntegrationTable({
  authConfigs,
  onAddConnection,
  onConnect,
  onViewDetails,
}: IntegrationTableProps) {
  if (authConfigs.length === 0) {
    return <EmptyState onAddConnection={onAddConnection} />;
  }

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Integration
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Auth Type
          </TableHead>
          <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Status
          </TableHead>
          <TableHead className="px-6 py-3 relative">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white divide-y divide-slate-200">
        {authConfigs.map((config) => {
          const statusBadge = getStatusBadge(config);
          
          return (
            <TableRow key={config.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onViewDetails?.(config)}>
              {/* Integration name */}
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {config.toolkit?.logo ? (
                    <img src={config.toolkit.logo} alt="" className="w-8 h-8 rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600">
                      {(config.toolkit?.name || config.name).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-slate-900">{config.name}</div>
                    <div className="text-xs text-slate-500">{config.toolkit?.name}</div>
                  </div>
                </div>
              </TableCell>

              {/* Auth type */}
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                  {config.authScheme?.replace("_", " ") || "Unknown"}
                </span>
              </TableCell>

              {/* Status */}
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <span className={cn("px-2 py-0.5 inline-flex text-xs font-semibold rounded-full", statusBadge.className)}>
                  {statusBadge.label}
                </span>
              </TableCell>

              {/* Actions */}
              <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                {config.isConnected ? (
                  <button className="text-indigo-600 hover:text-indigo-900 text-sm" onClick={(e) => { e.stopPropagation(); onViewDetails?.(config); }}>
                    View
                  </button>
                ) : (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); onConnect?.(config.id); }}>
                    Connect
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
