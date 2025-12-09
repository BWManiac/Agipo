"use client";

import { Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AgentConfig } from "@/_tables/types";
import { useAgentModalStore } from "../../store";

interface RecordsTabProps {
  agent: AgentConfig;
}

export function RecordsTab({ agent }: RecordsTabProps) {
  const records = useAgentModalStore((state) => state.records);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Assigned Tables</h2>
          <Button className="bg-black text-white hover:bg-gray-800 gap-1.5 h-9 text-sm">
            <Plus className="h-4 w-4" /> Assign Table
          </Button>
        </div>

        {/* Table 1: Stakeholder Interviews */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Stakeholder Interviews</h3>
              <p className="text-xs text-gray-500">Read-Only • 124 Records</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[80px] text-xs font-medium uppercase">ID</TableHead>
                  <TableHead className="text-xs font-medium uppercase">Stakeholder</TableHead>
                  <TableHead className="text-xs font-medium uppercase">Topic</TableHead>
                  <TableHead className="text-xs font-medium uppercase">Sentiment</TableHead>
                  <TableHead className="text-xs font-medium uppercase">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-xs text-gray-400">{record.id}</TableCell>
                    <TableCell className="text-sm">{record.stakeholder}</TableCell>
                    <TableCell className="text-sm">{record.topic}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        record.sentiment === "Positive" ? "bg-green-50 text-green-700" :
                        record.sentiment === "Negative" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {record.sentiment}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{record.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Table 2: Product Roadmap (Placeholder for visual fullness) */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm opacity-60 hover:opacity-100 transition-opacity">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Product Roadmap</h3>
              <p className="text-xs text-gray-500">Read/Write • 45 Records</p>
            </div>
          </div>
          <div className="p-8 text-center text-sm text-gray-400 italic">
            Preview hidden...
          </div>
        </div>

      </div>
    </div>
  );
}

