"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type Props = {
  className?: string;
};

const PrintButton: React.FC<Props> = ({ className }) => {
  return (
    <Button
      type="button"
      className={className}
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4 mr-2" />
      Imprimer
    </Button>
  );
};

export default PrintButton;
