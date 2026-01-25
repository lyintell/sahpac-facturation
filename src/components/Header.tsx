import { FileText, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import sahpacLogo from '@/assets/sahpac-logo.png';

interface HeaderProps {
  activeTab: 'invoices' | 'clients' | 'new';
  onTabChange: (tab: 'invoices' | 'clients' | 'new') => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnexion réussie');
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-elevated">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-2">
              <img src={sahpacLogo} alt="SAHPAC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">SAHPAC</h1>
              <p className="text-sm opacity-90">Gestion des Factures</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
            <nav className="flex gap-2">
              <Button
                variant={activeTab === 'invoices' ? 'secondary' : 'ghost'}
                onClick={() => onTabChange('invoices')}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Factures
              </Button>
              <Button
                variant={activeTab === 'clients' ? 'secondary' : 'ghost'}
                onClick={() => onTabChange('clients')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Clients
              </Button>
            </nav>
            
            <div className="flex items-center gap-2 border-l border-primary-foreground/20 pl-2 ml-2">
              <span className="text-sm opacity-75 hidden md:inline">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="md:hidden">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
