{
  description = "Mange your tournaments";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = inputs@{ self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs= import nixpkgs { 
          inherit system; 
        };
      in 
      {
       devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            nodePackages.npm
            nodePackages.pnpm
            nodePackages.typescript-language-server
          ]; 
      };
      });
}
