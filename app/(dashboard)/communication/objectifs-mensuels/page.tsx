"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Target } from "lucide-react";

const Page = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter Acteur
        </Button>
        <Button variant="default" size="sm">
          <Target className="mr-2 h-4 w-4" />
          Definir Objectifs
        </Button>
      </div>
    </div>
  );
};

export default Page;