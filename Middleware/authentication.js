module.exports.isLogged=(req,res,next)=>{
   if(!req.isAuthenticated()){
        req.session.redirectUrl= req.originalUrl;
        const isHostIntent = req.path === "/new" && req.query.intent === "host";
        if (isHostIntent) return res.redirect("/login?intent=host");
        req.flash("error","Please log in to continue.");
        return res.redirect("/login");
   }
   next();
};

module.exports.savedUrl=(req,res,next)=>{
   if(req.session.redirectUrl){
    res.locals.redirectUrl=req.session.redirectUrl;
   }
   next();
};

