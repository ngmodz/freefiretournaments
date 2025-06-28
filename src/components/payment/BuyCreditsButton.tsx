import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BuyCreditsButtonProps extends ButtonProps {
  label?: string;
  showIcon?: boolean;
  redirectTo?: string;
}

const BuyCreditsButton: React.FC<BuyCreditsButtonProps> = ({
  label = "Buy Credits",
  showIcon = true,
  redirectTo = "/credits",
  className,
  ...props
}) => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate(redirectTo);
  };

  return (
    <Button
      onClick={handleRedirect}
      className={className}
      {...props}
    >
      {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
      {label}
    </Button>
  );
};

export default BuyCreditsButton; 