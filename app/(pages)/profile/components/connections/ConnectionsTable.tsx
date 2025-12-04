"use client";

import { useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConnectionGroup, ConnectedAccount, AuthConfig } from "../../hooks/useConnections";

type ConnectionsTableProps = {
  connectionGroups: ConnectionGroup[];
  onAddConnection: () => void;
  onDisconnect: (connectionId: string) => Promise<boolean>;
  onReconnect?: (authConfigId: string) => void;
  onViewDetails?: (config: AuthConfig) => void;
};

function getStatusBadge(status: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "ACTIVE":
    case "CONNECTED":
      return { label: "Healthy", className: "bg-green-100 text-green-800" };
    case "PENDING":
      return { label: "Pending", className: "bg-yellow-100 text-yellow-800" };
    case "EXPIRED":
      return { label: "Token Expired", className: "bg-red-100 text-red-800" };
    case "FAILED":
      return { label: "Failed", className: "bg-red-100 text-red-800" };
    default:
      return { label: status || "Unknown", className: "bg-slate-100 text-slate-600" };
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function EmptyState({ onAddConnection }: { onAddConnection: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No connections yet</h3>
      <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">
        Connect your first service to enable your agents to interact with external tools.
      </p>
      <Button onClick={onAddConnection}>Add Connection</Button>
    </div>
  );
}

export function ConnectionsTable({
  connectionGroups,
  onAddConnection,
  onDisconnect,
  onReconnect,
  onViewDetails,
}: ConnectionsTableProps) {
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<ConnectedAccount | null>(null);

  const handleDisconnect = async () => {
    if (!confirmDisconnect) return;
    setDisconnecting(confirmDisconnect.id);
    const success = await onDisconnect(confirmDisconnect.id);
    setDisconnecting(null);
    setConfirmDisconnect(null);
    if (success) {
      // Will refetch via parent
    }
  };

  const isExpired = (status: string) => {
    const s = status?.toUpperCase();
    return s === "EXPIRED" || s === "FAILED";
  };

  if (connectionGroups.length === 0) {
    return <EmptyState onAddConnection={onAddConnection} />;
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">
              Service / Account
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-28">
              Auth Type
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
              Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
              Last Activity
            </TableHead>
            <TableHead className="px-6 py-3 relative w-32">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-slate-200">
          {connectionGroups.map((group) => (
            <>
              {/* Group Header */}
              <TableRow
                key={`group-${group.toolkit.slug}`}
                className="bg-slate-50/50 cursor-pointer hover:bg-slate-100/50"
                onClick={() => {
                  const firstConn = group.connections[0];
                  if (firstConn?.authConfig) onViewDetails?.(firstConn.authConfig);
                }}
              >
                <TableCell colSpan={5} className="px-6 py-3">
                  <div className="flex items-center">
                    {group.toolkit.logo ? (
                      <img src={group.toolkit.logo} alt="" className="h-6 w-6 rounded" />
                    ) : (
                      <div className="h-6 w-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-600">
                        {(group.toolkit.name || group.toolkit.slug).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {group.toolkit.name || group.toolkit.slug}
                    </span>
                  </div>
                </TableCell>
              </TableRow>

              {/* Connection Rows */}
              {group.connections.map((conn) => {
                const statusBadge = getStatusBadge(conn.status);
                const expired = isExpired(conn.status);
                const displayName = conn.authConfig?.name || conn.toolkitSlug;
                const initial = displayName.charAt(0).toUpperCase();

                return (
                  <TableRow
                    key={conn.id}
                    className={cn(
                      "hover:bg-slate-50 transition-colors cursor-pointer",
                      expired && "bg-red-50/30 hover:bg-red-50/50"
                    )}
                    onClick={() => conn.authConfig && onViewDetails?.(conn.authConfig)}
                  >
                    <TableCell className="px-6 py-4 pl-12">
                      <div className="flex items-center">
                        <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold flex items-center justify-center mr-3">
                          {initial}
                        </span>
                        <div className="text-sm font-medium text-slate-900">
                          {displayName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {conn.authConfig?.authScheme?.replace("_", " ") || "OAuth 2.0"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={cn("px-2 py-0.5 inline-flex text-xs font-semibold rounded-full", statusBadge.className)}>
                        {statusBadge.label}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(conn.updatedAt || conn.createdAt)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {expired ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => { e.stopPropagation(); onReconnect?.(conn.authConfig?.id || ""); }}
                        >
                          Reconnect
                        </Button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDisconnect(conn); }}
                          className="text-slate-500 hover:text-red-600 text-sm"
                          disabled={disconnecting === conn.id}
                        >
                          {disconnecting === conn.id ? "..." : "Disconnect"}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!confirmDisconnect} onOpenChange={() => setConfirmDisconnect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect this account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to {confirmDisconnect?.authConfig?.name || confirmDisconnect?.toolkitSlug}. 
              Your agents will no longer be able to use this integration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
